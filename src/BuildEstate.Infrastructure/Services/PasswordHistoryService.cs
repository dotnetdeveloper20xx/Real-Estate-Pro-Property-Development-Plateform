using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Manages password history records to enforce the policy that users cannot
/// reuse any of their previous 5 passwords.
/// </summary>
public sealed class PasswordHistoryService : IPasswordHistoryService
{
    private const int MaxHistoryEntries = 5;

    private readonly BuildEstateDbContext _dbContext;
    private readonly IPasswordHasher<ApplicationUser> _passwordHasher;
    private readonly ILogger<PasswordHistoryService> _logger;

    public PasswordHistoryService(
        BuildEstateDbContext dbContext,
        IPasswordHasher<ApplicationUser> passwordHasher,
        ILogger<PasswordHistoryService> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<bool> IsPasswordReusedAsync(
        string userId, string newPassword, CancellationToken ct = default)
    {
        var recentHashes = await _dbContext.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .OrderByDescending(ph => ph.CreatedAt)
            .Take(MaxHistoryEntries)
            .Select(ph => ph.PasswordHash)
            .ToListAsync(ct);

        // Use a dummy ApplicationUser instance for the hasher verification.
        // The VerifyHashedPassword method only uses the user parameter for
        // potential re-hashing notifications — the actual verification is
        // performed against the stored hash and provided password.
        var dummyUser = new ApplicationUser { Id = userId };

        foreach (var storedHash in recentHashes)
        {
            var result = _passwordHasher.VerifyHashedPassword(
                dummyUser, storedHash, newPassword);

            if (result is PasswordVerificationResult.Success
                or PasswordVerificationResult.SuccessRehashNeeded)
            {
                _logger.LogInformation(
                    "Password reuse detected for user {UserId}. The new password matches a previous password.",
                    userId);
                return true;
            }
        }

        return false;
    }

    /// <inheritdoc />
    public async Task RecordPasswordChangeAsync(
        string userId, string passwordHash, CancellationToken ct = default)
    {
        var entry = new PasswordHistory
        {
            UserId = userId,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };

        await _dbContext.PasswordHistories.AddAsync(entry, ct);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Password history entry recorded for user {UserId}.",
            userId);
    }
}
