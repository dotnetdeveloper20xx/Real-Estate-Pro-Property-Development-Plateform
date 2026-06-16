namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Manages password history to enforce password reuse policies.
/// Tracks the last 5 password hashes per user and prevents reuse.
/// </summary>
public interface IPasswordHistoryService
{
    /// <summary>
    /// Checks whether the new raw password matches any of the user's previous 5 passwords
    /// using the Identity hasher's VerifyHashedPassword method.
    /// </summary>
    /// <param name="userId">The user's ID.</param>
    /// <param name="newPassword">The raw (plaintext) password to check against history.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the password matches any of the last 5 stored hashes (reused); false otherwise.</returns>
    Task<bool> IsPasswordReusedAsync(
        string userId, string newPassword, CancellationToken ct = default);

    /// <summary>
    /// Records a password hash in the user's password history.
    /// Should be called after every successful password change.
    /// </summary>
    /// <param name="userId">The user's ID.</param>
    /// <param name="passwordHash">The hashed password to record.</param>
    /// <param name="ct">Cancellation token.</param>
    Task RecordPasswordChangeAsync(
        string userId, string passwordHash, CancellationToken ct = default);
}
