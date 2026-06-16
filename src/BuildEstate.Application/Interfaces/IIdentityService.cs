namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Abstracts ASP.NET Identity operations for the Application layer.
/// Provides user lookup, password verification, and role retrieval
/// without requiring direct dependency on Infrastructure Identity types.
/// </summary>
public interface IIdentityService
{
    /// <summary>
    /// Finds a user by email address.
    /// Returns null if no user exists with the specified email.
    /// </summary>
    Task<UserIdentityResult?> FindByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// Finds a user by their unique identifier.
    /// Returns null if no user exists with the specified ID.
    /// </summary>
    Task<UserIdentityResult?> FindByIdAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Verifies the provided password against the user's stored password hash.
    /// Does NOT handle lockout logic — that is managed separately by IAccountLockoutService.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="password">The plaintext password to verify.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the password is correct; otherwise false.</returns>
    Task<bool> CheckPasswordAsync(string userId, string password, CancellationToken ct = default);

    /// <summary>
    /// Gets the role names assigned to the specified user.
    /// </summary>
    Task<IList<string>> GetRolesAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Updates the user's LastLoginAt timestamp.
    /// </summary>
    Task UpdateLastLoginAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Updates a user's profile fields (first name, last name, email).
    /// Returns true if the update succeeded; false if it failed (e.g., email already in use).
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="firstName">The new first name.</param>
    /// <param name="lastName">The new last name.</param>
    /// <param name="email">The new email address.</param>
    /// <param name="updatedBy">The ID of the user performing the update.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if update succeeded; otherwise false.</returns>
    Task<bool> UpdateUserAsync(string userId, string firstName, string lastName, string email, string updatedBy, CancellationToken ct = default);

    /// <summary>
    /// Replaces all role assignments for a user with the specified set of roles.
    /// Removes roles not in the new list and adds roles not currently assigned.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="newRoles">The complete set of roles the user should have.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if roles were updated successfully; otherwise false.</returns>
    Task<bool> UpdateUserRolesAsync(string userId, IList<string> newRoles, CancellationToken ct = default);

    /// <summary>
    /// Checks whether an email address is already used by another user (excluding the specified user).
    /// </summary>
    /// <param name="email">The email to check.</param>
    /// <param name="excludeUserId">The user ID to exclude from the check (the user being edited).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the email is already in use by another user; otherwise false.</returns>
    Task<bool> IsEmailTakenAsync(string email, string excludeUserId, CancellationToken ct = default);
}

/// <summary>
/// Represents the minimal user identity information needed by Application-layer commands.
/// Decouples from the Infrastructure ApplicationUser type.
/// </summary>
public sealed record UserIdentityResult
{
    public string UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}
