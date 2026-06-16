using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Implements account lockout management by wrapping ASP.NET Identity's built-in
/// lockout mechanism via UserManager. Provides a clean application-layer abstraction
/// over Identity's AccessFailedCount, LockoutEnd, and lockout configuration.
///
/// Configured thresholds:
/// - MaxFailedAccessAttempts: 5
/// - DefaultLockoutTimeSpan: 15 minutes
/// - AllowedForNewUsers: true
///
/// Automatic unlock occurs when the lockout end date passes; Identity handles this
/// transparently when IsLockedOutAsync is queried.
/// </summary>
public sealed class AccountLockoutService : IAccountLockoutService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AccountLockoutService> _logger;

    public AccountLockoutService(
        UserManager<ApplicationUser> userManager,
        ILogger<AccountLockoutService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<bool> IncrementFailedAttemptsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(userId);

        // Ensure lockout is enabled for this user
        if (!await _userManager.GetLockoutEnabledAsync(user))
        {
            await _userManager.SetLockoutEnabledAsync(user, true);
        }

        var result = await _userManager.AccessFailedAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning(
                "Failed to increment access failed count for user {UserId}. Errors: {Errors}",
                userId, errors);
            throw new InvalidOperationException(
                $"Failed to record failed login attempt for user '{userId}': {errors}");
        }

        var isLockedOut = await _userManager.IsLockedOutAsync(user);

        if (isLockedOut)
        {
            var failedCount = await _userManager.GetAccessFailedCountAsync(user);
            _logger.LogWarning(
                "User {UserId} has been locked out after {FailedAttempts} failed login attempts.",
                userId, failedCount);
        }
        else
        {
            var failedCount = await _userManager.GetAccessFailedCountAsync(user);
            _logger.LogInformation(
                "Failed login attempt recorded for user {UserId}. Current count: {FailedAttempts}.",
                userId, failedCount);
        }

        return isLockedOut;
    }

    /// <inheritdoc />
    public async Task ResetFailedAttemptsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(userId);

        var result = await _userManager.ResetAccessFailedCountAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning(
                "Failed to reset access failed count for user {UserId}. Errors: {Errors}",
                userId, errors);
            throw new InvalidOperationException(
                $"Failed to reset failed login attempts for user '{userId}': {errors}");
        }

        _logger.LogInformation(
            "Failed login attempt counter reset to zero for user {UserId}.",
            userId);
    }

    /// <inheritdoc />
    public async Task<bool> IsLockedOutAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(userId);

        var isLockedOut = await _userManager.IsLockedOutAsync(user);

        if (isLockedOut)
        {
            _logger.LogInformation(
                "Account lockout check: User {UserId} is currently locked out.",
                userId);
        }

        return isLockedOut;
    }

    /// <inheritdoc />
    public async Task<DateTimeOffset?> GetLockoutEndAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(userId);

        var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);

        // If the lockout end is in the past, the user is no longer locked out
        if (lockoutEnd.HasValue && lockoutEnd.Value <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        return lockoutEnd;
    }

    /// <inheritdoc />
    public async Task<int> GetFailedAttemptsCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(userId);

        return await _userManager.GetAccessFailedCountAsync(user);
    }

    /// <inheritdoc />
    public async Task<TimeSpan> GetRemainingLockoutTimeAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(userId);

        var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);

        if (!lockoutEnd.HasValue)
        {
            return TimeSpan.Zero;
        }

        var remaining = lockoutEnd.Value - DateTimeOffset.UtcNow;

        if (remaining <= TimeSpan.Zero)
        {
            return TimeSpan.Zero;
        }

        _logger.LogInformation(
            "User {UserId} has {RemainingMinutes:F1} minutes remaining in lockout period.",
            userId, remaining.TotalMinutes);

        return remaining;
    }

    /// <summary>
    /// Retrieves the user by ID or throws if not found.
    /// </summary>
    private async Task<ApplicationUser> GetUserOrThrowAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
        {
            throw new InvalidOperationException($"User with ID '{userId}' was not found.");
        }

        return user;
    }
}
