using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BuildEstate.Infrastructure.Identity;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Implements session management with device info parsing from user-agent strings,
/// session creation, retrieval of active sessions, and revocation capabilities.
/// </summary>
public sealed class SessionService : ISessionService
{
    private const int SessionExpiryDays = 7;

    private readonly BuildEstateDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<SessionService> _logger;

    public SessionService(
        BuildEstateDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ILogger<SessionService> logger)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<UserSession> CreateSessionAsync(
        string userId, string ipAddress, string userAgent, CancellationToken ct = default)
    {
        var (browser, operatingSystem) = ParseUserAgent(userAgent);

        var session = new UserSession
        {
            UserId = userId,
            DeviceInfo = userAgent,
            Browser = browser,
            OperatingSystem = operatingSystem,
            IpAddress = ipAddress,
            City = null,       // Geolocation requires external API — deferred
            Country = null,    // Geolocation requires external API — deferred
            CreatedAt = DateTime.UtcNow,
            LastActiveAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(SessionExpiryDays),
            IsRevoked = false
        };

        await _dbContext.UserSessions.AddAsync(session, ct);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Created session {SessionId} for user {UserId} from {IpAddress} ({Browser}/{OS})",
            session.Id, userId, ipAddress, browser, operatingSystem);

        return session;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<UserSession>> GetActiveSessionsAsync(
        string userId, CancellationToken ct = default)
    {
        var sessions = await _dbContext.UserSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId
                && !s.IsRevoked
                && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.LastActiveAt)
            .ToListAsync(ct);

        return sessions;
    }

    /// <inheritdoc />
    public async Task RevokeSessionAsync(
        Guid sessionId, string reason, CancellationToken ct = default)
    {
        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session is null)
        {
            _logger.LogWarning("Attempted to revoke non-existent session {SessionId}", sessionId);
            return;
        }

        if (session.IsRevoked)
        {
            return; // Already revoked — idempotent
        }

        session.IsRevoked = true;
        session.RevokedReason = reason;
        session.RevokedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Revoked session {SessionId} for user {UserId}. Reason: {Reason}",
            sessionId, session.UserId, reason);
    }

    /// <inheritdoc />
    public async Task RevokeAllUserSessionsAsync(
        string userId, string reason, CancellationToken ct = default)
    {
        var activeSessions = await _dbContext.UserSessions
            .Where(s => s.UserId == userId && !s.IsRevoked)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;

        foreach (var session in activeSessions)
        {
            session.IsRevoked = true;
            session.RevokedReason = reason;
            session.RevokedAt = now;
        }

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Revoked {Count} active sessions for user {UserId}. Reason: {Reason}",
            activeSessions.Count, userId, reason);
    }

    /// <inheritdoc />
    public async Task RevokeSessionsForRoleAsync(
        string roleId, string reason, CancellationToken ct = default)
    {
        // Find all users assigned to this role via Identity's AspNetUserRoles table
        var usersInRole = await _dbContext.UserRoles
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => ur.UserId)
            .ToListAsync(ct);

        if (usersInRole.Count == 0)
        {
            _logger.LogInformation(
                "No users found for role {RoleId}. No sessions to revoke.", roleId);
            return;
        }

        var activeSessions = await _dbContext.UserSessions
            .Where(s => usersInRole.Contains(s.UserId) && !s.IsRevoked)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;

        foreach (var session in activeSessions)
        {
            session.IsRevoked = true;
            session.RevokedReason = reason;
            session.RevokedAt = now;
        }

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Revoked {SessionCount} active sessions for {UserCount} users in role {RoleId}. Reason: {Reason}",
            activeSessions.Count, usersInRole.Count, roleId, reason);
    }

    /// <summary>
    /// Parses a user-agent string to extract browser name/version and operating system.
    /// Uses simple string matching for common browsers and OS patterns.
    /// </summary>
    /// <param name="userAgent">The raw User-Agent header value.</param>
    /// <returns>A tuple of (browser, operatingSystem) strings.</returns>
    internal static (string Browser, string OperatingSystem) ParseUserAgent(string userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return ("Unknown", "Unknown");
        }

        var browser = ParseBrowser(userAgent);
        var operatingSystem = ParseOperatingSystem(userAgent);

        return (browser, operatingSystem);
    }

    private static string ParseBrowser(string userAgent)
    {
        // Order matters: check more specific browsers first (they often include other browser tokens)
        if (userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractVersionedName(userAgent, "Edg/", "Edge");
        }

        if (userAgent.Contains("OPR/", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("Opera", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractVersionedName(userAgent, "OPR/", "Opera");
        }

        if (userAgent.Contains("Vivaldi/", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractVersionedName(userAgent, "Vivaldi/", "Vivaldi");
        }

        if (userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase) &&
            !userAgent.Contains("Chromium", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractVersionedName(userAgent, "Chrome/", "Chrome");
        }

        if (userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractVersionedName(userAgent, "Firefox/", "Firefox");
        }

        if (userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase) &&
            userAgent.Contains("Version/", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractVersionedName(userAgent, "Version/", "Safari");
        }

        if (userAgent.Contains("MSIE", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("Trident/", StringComparison.OrdinalIgnoreCase))
        {
            return "Internet Explorer";
        }

        return "Unknown";
    }

    private static string ParseOperatingSystem(string userAgent)
    {
        if (userAgent.Contains("Windows NT 10.0", StringComparison.OrdinalIgnoreCase))
        {
            // Windows 11 uses "Windows NT 10.0" but may include specific build hints
            // For simplicity, report as "Windows 10+" 
            return "Windows 10";
        }

        if (userAgent.Contains("Windows NT 6.3", StringComparison.OrdinalIgnoreCase))
        {
            return "Windows 8.1";
        }

        if (userAgent.Contains("Windows NT 6.2", StringComparison.OrdinalIgnoreCase))
        {
            return "Windows 8";
        }

        if (userAgent.Contains("Windows NT 6.1", StringComparison.OrdinalIgnoreCase))
        {
            return "Windows 7";
        }

        if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase))
        {
            return "Windows";
        }

        if (userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase))
        {
            return "iOS";
        }

        if (userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase))
        {
            return "iPadOS";
        }

        if (userAgent.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase) ||
            userAgent.Contains("Macintosh", StringComparison.OrdinalIgnoreCase))
        {
            return "macOS";
        }

        if (userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase))
        {
            return "Android";
        }

        if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase))
        {
            return "Linux";
        }

        if (userAgent.Contains("CrOS", StringComparison.OrdinalIgnoreCase))
        {
            return "Chrome OS";
        }

        return "Unknown";
    }

    /// <summary>
    /// Extracts a versioned browser name from the user-agent string.
    /// For example, given "Chrome/" token and user-agent containing "Chrome/125.0.6422.77",
    /// returns "Chrome 125".
    /// </summary>
    private static string ExtractVersionedName(string userAgent, string token, string displayName)
    {
        var index = userAgent.IndexOf(token, StringComparison.OrdinalIgnoreCase);
        if (index < 0)
        {
            return displayName;
        }

        var versionStart = index + token.Length;
        var versionEnd = versionStart;

        // Walk forward to capture the major version number (up to first dot or space)
        while (versionEnd < userAgent.Length &&
               userAgent[versionEnd] != '.' &&
               userAgent[versionEnd] != ' ' &&
               userAgent[versionEnd] != ';')
        {
            versionEnd++;
        }

        if (versionEnd > versionStart)
        {
            var majorVersion = userAgent[versionStart..versionEnd];
            return $"{displayName} {majorVersion}";
        }

        return displayName;
    }
}
