namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides account lockout management wrapping ASP.NET Identity's built-in
/// lockout mechanism. Tracks failed login attempts, determines lockout status,
/// and handles automatic unlock after lockout expiry.
///
/// Configured thresholds:
/// - MaxFailedAccessAttempts: 5
/// - DefaultLockoutTimeSpan: 15 minutes
/// - AllowedForNewUsers: true
/// </summary>
public interface IAccountLockoutService
{
    /// <summary>
    /// Records a failed login attempt for the specified user. If the failed attempt
    /// count reaches the configured threshold (5 attempts), the account is locked
    /// for the configured duration (15 minutes).
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if the account became locked as a result of this increment; otherwise false.</returns>
    Task<bool> IncrementFailedAttemptsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resets the failed login attempt counter to zero for the specified user.
    /// Should be called upon successful authentication.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task ResetFailedAttemptsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Determines whether the specified user account is currently locked out.
    /// Returns true if the lockout end date is in the future; false otherwise
    /// (including after automatic unlock on expiry).
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if the account is currently locked out; otherwise false.</returns>
    Task<bool> IsLockedOutAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the lockout end date/time for the specified user, or null if the account
    /// is not currently locked out.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The lockout end date if locked; otherwise null.</returns>
    Task<DateTimeOffset?> GetLockoutEndAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current number of consecutive failed login attempts for the specified user.
    /// Returns 0 if the counter has been reset.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The number of failed access attempts.</returns>
    Task<int> GetFailedAttemptsCountAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the remaining lockout duration for the specified user. Returns TimeSpan.Zero
    /// if the account is not currently locked out or the lockout has expired.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The remaining lockout duration, or TimeSpan.Zero if not locked.</returns>
    Task<TimeSpan> GetRemainingLockoutTimeAsync(string userId, CancellationToken cancellationToken = default);
}
