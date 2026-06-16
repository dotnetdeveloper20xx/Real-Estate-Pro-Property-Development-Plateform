using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;

namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides user identity management operations wrapping ASP.NET Identity's UserManager.
/// Abstracts password verification, password change, and user lookup for the Application layer
/// without exposing Infrastructure-level Identity types.
/// </summary>
public interface IUserIdentityService
{
    /// <summary>
    /// Retrieves the full profile for a user including identity details, assigned roles,
    /// and aggregated permissions from all assigned roles.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The user's profile as <see cref="CurrentUserDto"/>, or null if the user is not found.</returns>
    Task<CurrentUserDto?> GetCurrentUserAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Verifies a user's current password against the stored hash.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="password">The plaintext password to verify.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the password matches; otherwise false.</returns>
    Task<bool> VerifyPasswordAsync(string userId, string password, CancellationToken ct = default);

    /// <summary>
    /// Changes a user's password after verifying the current password.
    /// Returns a result indicating success or failure with error details.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="currentPassword">The user's current plaintext password.</param>
    /// <param name="newPassword">The new plaintext password to set.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success or a list of identity errors.</returns>
    Task<PasswordChangeResult> ChangePasswordAsync(
        string userId, string currentPassword, string newPassword, CancellationToken ct = default);

    /// <summary>
    /// Gets the password hash for a user. Used for recording in password history.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The user's current password hash, or null if user not found.</returns>
    Task<string?> GetPasswordHashAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Gets basic user info needed for audit logging (first name, last name).
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The user's display name, or null if not found.</returns>
    Task<string?> GetUserDisplayNameAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Checks whether a user exists and is active.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the user exists and is active; otherwise false.</returns>
    Task<bool> UserExistsAndIsActiveAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Checks whether an email address is already registered.
    /// </summary>
    /// <param name="email">The email address to check.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the email already exists; otherwise false.</returns>
    Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// Checks whether a role with the specified name exists.
    /// </summary>
    /// <param name="roleName">The role name to check.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the role exists; otherwise false.</returns>
    Task<bool> RoleExistsAsync(string roleName, CancellationToken ct = default);

    /// <summary>
    /// Creates a new user with the specified details and password.
    /// </summary>
    /// <param name="firstName">User's first name.</param>
    /// <param name="lastName">User's last name.</param>
    /// <param name="email">User's email address.</param>
    /// <param name="password">The plaintext password to set.</param>
    /// <param name="createdBy">The ID of the admin creating the user.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success with the new user ID, or failure with error messages.</returns>
    Task<CreateUserIdentityResult> CreateUserAsync(
        string firstName, string lastName, string email, string password,
        string createdBy, CancellationToken ct = default);

    /// <summary>
    /// Assigns a list of roles to a user.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="roles">The role names to assign.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success or failure.</returns>
    Task<IdentityOperationResult> AssignRolesAsync(
        string userId, IEnumerable<string> roles, CancellationToken ct = default);

    /// <summary>
    /// Resets a user's password using the Identity token-based reset flow.
    /// Generates a password reset token internally, then applies the new password.
    /// This is an admin-initiated operation that does not require the current password.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="newPassword">The new plaintext password to set.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success or a list of identity errors.</returns>
    Task<PasswordChangeResult> ResetPasswordAsync(string userId, string newPassword, CancellationToken ct = default);

    /// <summary>
    /// Deactivates a user account by setting IsActive to false.
    /// Returns the user's display name and the previous IsActive value for audit purposes.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="adminUserId">The admin performing the deactivation.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result containing the user's display name and previous active status, or failure if user not found.</returns>
    Task<UserStatusChangeResult> DeactivateUserAsync(string userId, string adminUserId, CancellationToken ct = default);

    /// <summary>
    /// Reactivates a user account by setting IsActive to true.
    /// Returns the user's display name and the previous IsActive value for audit purposes.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="adminUserId">The admin performing the reactivation.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result containing the user's display name and previous active status, or failure if user not found.</returns>
    Task<UserStatusChangeResult> ReactivateUserAsync(string userId, string adminUserId, CancellationToken ct = default);
}

/// <summary>
/// Result of a user creation operation.
/// </summary>
public sealed record CreateUserIdentityResult
{
    public bool Succeeded { get; init; }
    public string? UserId { get; init; }
    public string? PasswordHash { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static CreateUserIdentityResult Success(string userId, string passwordHash) =>
        new() { Succeeded = true, UserId = userId, PasswordHash = passwordHash };

    public static CreateUserIdentityResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}

/// <summary>
/// Result of a generic identity operation (e.g., role assignment).
/// </summary>
public sealed record IdentityOperationResult
{
    public bool Succeeded { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static IdentityOperationResult Success() => new() { Succeeded = true };
    public static IdentityOperationResult Failure(IReadOnlyList<string> errors) => new() { Succeeded = false, Errors = errors };
}

/// <summary>
/// Result of a password change operation.
/// </summary>
public sealed record PasswordChangeResult
{
    public bool Succeeded { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static PasswordChangeResult Success() => new() { Succeeded = true };
    public static PasswordChangeResult Failure(IReadOnlyList<string> errors) => new() { Succeeded = false, Errors = errors };
}

/// <summary>
/// Result of a user activation status change (deactivation or reactivation).
/// Contains the user's display name and old IsActive value for audit logging.
/// </summary>
public sealed record UserStatusChangeResult
{
    public bool Succeeded { get; init; }
    public string? UserDisplayName { get; init; }
    public bool PreviousIsActive { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static UserStatusChangeResult Success(string userDisplayName, bool previousIsActive) =>
        new() { Succeeded = true, UserDisplayName = userDisplayName, PreviousIsActive = previousIsActive };

    public static UserStatusChangeResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}
