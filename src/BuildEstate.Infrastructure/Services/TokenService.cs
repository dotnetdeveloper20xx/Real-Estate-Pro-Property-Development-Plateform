using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Implements JWT access token generation, refresh token rotation with 30-second grace period,
/// and token revocation. Reads JWT configuration from the "JwtSettings" configuration section.
/// Implements both the Application-layer ITokenService (for command handlers) and the
/// Infrastructure-layer IInfrastructureTokenService (for API controllers with ApplicationUser access).
/// </summary>
public sealed class TokenService : IInfrastructureTokenService
{
    private const int AccessTokenExpiryMinutes = 60;
    private const int DefaultRefreshTokenExpiryDays = 7;
    private const int RememberMeRefreshTokenExpiryDays = 30;
    private const int GracePeriodSeconds = 30;

    private readonly IConfiguration _configuration;
    private readonly BuildEstateDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<TokenService> _logger;

    public TokenService(
        IConfiguration configuration,
        BuildEstateDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ILogger<TokenService> logger)
    {
        _configuration = configuration;
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        ApplicationUser user, IList<string> roles, bool rememberMe = false,
        string? deviceInfo = null, string? ipAddress = null, CancellationToken ct = default)
    {
        return await GenerateTokensAsync(
            user.Id, user.Email ?? string.Empty, user.FirstName, user.LastName,
            roles, rememberMe, deviceInfo, ipAddress, ct);
    }

    /// <inheritdoc />
    public async Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        string userId, string email, string firstName, string lastName,
        IList<string> roles, bool rememberMe = false,
        string? deviceInfo = null, string? ipAddress = null, CancellationToken ct = default)
    {
        var accessToken = GenerateAccessToken(userId, email, firstName, lastName, roles);

        var refreshTokenExpiryDays = rememberMe
            ? RememberMeRefreshTokenExpiryDays
            : DefaultRefreshTokenExpiryDays;

        var refreshToken = await CreateRefreshTokenAsync(
            userId, refreshTokenExpiryDays, deviceInfo, ipAddress, ct);

        _logger.LogInformation(
            "Generated token pair for user {UserId} with {ExpiryDays}-day refresh expiry",
            userId, refreshTokenExpiryDays);

        return (accessToken, refreshToken);
    }

    /// <inheritdoc />
    public async Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(
        string refreshToken, string ipAddress, string deviceInfo, CancellationToken ct = default)
    {
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken, ct);

        if (storedToken is null)
        {
            throw new InvalidOperationException("Invalid refresh token.");
        }

        if (storedToken.IsRevoked)
        {
            throw new InvalidOperationException("Refresh token has been revoked.");
        }

        if (storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Refresh token has expired.");
        }

        // If the token was already used, check grace period
        if (storedToken.IsUsed)
        {
            var usedAt = storedToken.UsedAt ?? storedToken.CreatedAt;
            var gracePeriodEnd = usedAt.AddSeconds(GracePeriodSeconds);

            if (DateTime.UtcNow <= gracePeriodEnd)
            {
                // Within grace period — allow the refresh without creating a new token pair
                // This handles race conditions from concurrent requests
                _logger.LogInformation(
                    "Refresh token {TokenId} used within grace period for user {UserId}",
                    storedToken.Id, storedToken.UserId);

                var graceUser = await _userManager.FindByIdAsync(storedToken.UserId)
                    ?? throw new InvalidOperationException("User not found.");

                var graceRoles = await _userManager.GetRolesAsync(graceUser);
                var graceAccessToken = GenerateAccessToken(
                    graceUser.Id, graceUser.Email ?? string.Empty,
                    graceUser.FirstName, graceUser.LastName, graceRoles);

                // Return the replacement token if one was already created, otherwise create new
                var replacementToken = await _dbContext.RefreshTokens
                    .Where(t => t.UserId == storedToken.UserId
                        && t.CreatedAt > storedToken.CreatedAt
                        && !t.IsRevoked
                        && !t.IsUsed
                        && t.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(t => t.CreatedAt)
                    .FirstOrDefaultAsync(ct);

                if (replacementToken is not null)
                {
                    return (graceAccessToken, replacementToken.Token);
                }

                // No replacement found — create a new one
                var remainingDays = (storedToken.ExpiresAt - storedToken.CreatedAt).TotalDays;
                var expiryDays = remainingDays > DefaultRefreshTokenExpiryDays
                    ? RememberMeRefreshTokenExpiryDays
                    : DefaultRefreshTokenExpiryDays;

                var newGraceRefreshToken = await CreateRefreshTokenAsync(storedToken.UserId, expiryDays, deviceInfo, ipAddress, ct);
                return (graceAccessToken, newGraceRefreshToken);
            }

            // Beyond grace period — potential token theft. Revoke all tokens.
            _logger.LogWarning(
                "Refresh token {TokenId} reused beyond grace period for user {UserId}. " +
                "Potential token theft detected. Revoking all user tokens.",
                storedToken.Id, storedToken.UserId);

            await RevokeAllUserTokensAsync(storedToken.UserId, ct);
            throw new InvalidOperationException(
                "Refresh token has already been consumed. All tokens have been revoked for security.");
        }

        // Mark the current token as used with timestamp for grace period tracking
        storedToken.IsUsed = true;
        storedToken.UsedAt = DateTime.UtcNow;

        // Get the user and their roles
        var user = await _userManager.FindByIdAsync(storedToken.UserId)
            ?? throw new InvalidOperationException("User not found.");

        if (!user.IsActive)
        {
            throw new InvalidOperationException("User account is deactivated.");
        }

        var roles = await _userManager.GetRolesAsync(user);

        // Generate new tokens — preserve the "remember me" setting from original token
        var originalExpirySpan = (storedToken.ExpiresAt - storedToken.CreatedAt).TotalDays;
        var refreshExpiryDays = originalExpirySpan > DefaultRefreshTokenExpiryDays
            ? RememberMeRefreshTokenExpiryDays
            : DefaultRefreshTokenExpiryDays;

        var newAccessToken = GenerateAccessToken(
            user.Id, user.Email ?? string.Empty, user.FirstName, user.LastName, roles);
        var newRefreshToken = await CreateRefreshTokenAsync(
            user.Id, refreshExpiryDays, deviceInfo, ipAddress, ct);

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Rotated refresh token for user {UserId}. Old token {OldTokenId} marked as used.",
            user.Id, storedToken.Id);

        return (newAccessToken, newRefreshToken);
    }

    /// <inheritdoc />
    public async Task RevokeAllUserTokensAsync(string userId, CancellationToken ct = default)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ToListAsync(ct);

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Revoked {Count} refresh tokens for user {UserId}",
            activeTokens.Count, userId);
    }

    /// <inheritdoc />
    public async Task RevokeTokenAsync(Guid tokenId, CancellationToken ct = default)
    {
        var token = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Id == tokenId, ct);

        if (token is null)
        {
            _logger.LogWarning("Attempted to revoke non-existent token {TokenId}", tokenId);
            return;
        }

        if (token.IsRevoked)
        {
            return; // Already revoked — idempotent operation
        }

        token.IsRevoked = true;
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Revoked refresh token {TokenId} for user {UserId}",
            tokenId, token.UserId);
    }

    /// <inheritdoc />
    public async Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken, ct);

        if (token is null)
        {
            _logger.LogWarning("Attempted to revoke non-existent refresh token by value");
            return;
        }

        if (token.IsRevoked)
        {
            return; // Already revoked — idempotent operation
        }

        token.IsRevoked = true;
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Revoked refresh token {TokenId} for user {UserId} during logout",
            token.Id, token.UserId);
    }

    /// <summary>
    /// Generates a JWT access token containing user ID, email, name, roles, and permission claims
    /// with a 60-minute expiration window.
    /// </summary>
    private string GenerateAccessToken(string userId, string email, string firstName, string lastName, IList<string> roles)
    {
        var issuer = _configuration["JwtSettings:Issuer"]
            ?? _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is not configured.");
        var audience = _configuration["JwtSettings:Audience"]
            ?? _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT Audience is not configured.");
        var secretKey = _configuration["JwtSettings:Secret"]
            ?? _configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("JWT Secret key is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(AccessTokenExpiryMinutes);

        // Load all distinct permission names for the user's roles
        var roleIds = _dbContext.Roles
            .Where(r => roles.Contains(r.Name!))
            .Select(r => r.Id)
            .ToList();

        var permissions = _dbContext.RolePermissions
            .Where(rp => roleIds.Contains(rp.RoleId))
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToList();

        // Use Claims dictionary exclusively for full control over JWT payload
        // The JwtSecurityTokenHandler v7+ drops custom claims from Subject/ClaimsIdentity
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = userId,
                [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString(),
                [JwtRegisteredClaimNames.Email] = email,
                ["full_name"] = $"{firstName} {lastName}".Trim(),
                ["role"] = roles.ToArray(),
                ["permission"] = permissions.ToArray()
            },
            Expires = expires,
            NotBefore = now,
            IssuedAt = now,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Creates and persists a new cryptographically secure refresh token for the user.
    /// </summary>
    private async Task<string> CreateRefreshTokenAsync(
        string userId, int expiryDays, string? deviceInfo = null, string? ipAddress = null,
        CancellationToken ct = default)
    {
        var tokenValue = GenerateSecureRandomToken();

        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = tokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
            CreatedAt = DateTime.UtcNow,
            DeviceInfo = deviceInfo ?? string.Empty,
            IpAddress = ipAddress ?? string.Empty
        };

        await _dbContext.RefreshTokens.AddAsync(refreshToken, ct);
        await _dbContext.SaveChangesAsync(ct);

        return tokenValue;
    }

    /// <summary>
    /// Generates a cryptographically secure random token string (64 bytes, Base64-encoded).
    /// </summary>
    private static string GenerateSecureRandomToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
