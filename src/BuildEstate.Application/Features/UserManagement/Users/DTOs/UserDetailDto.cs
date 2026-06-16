namespace BuildEstate.Application.Features.UserManagement.Users.DTOs;

/// <summary>
/// Comprehensive user detail data transfer object.
/// Includes user information, assigned roles, security summary, and active sessions.
/// Used by the user detail page to display full account context.
/// </summary>
public sealed record UserDetailDto
{
    /// <summary>The user's unique identifier.</summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>The user's first name.</summary>
    public string FirstName { get; init; } = string.Empty;

    /// <summary>The user's last name.</summary>
    public string LastName { get; init; } = string.Empty;

    /// <summary>The user's email address.</summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>Whether the user account is currently active.</summary>
    public bool IsActive { get; init; }

    /// <summary>Timestamp when the account was created (UTC).</summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>List of role names assigned to the user.</summary>
    public string[] Roles { get; init; } = [];

    /// <summary>Timestamp of the user's most recent successful login, or null if never logged in.</summary>
    public DateTime? LastLoginAt { get; init; }

    // --- Security Summary ---

    /// <summary>Timestamp when the user's password was last changed, or null if never changed.</summary>
    public DateTime? PasswordLastChangedAt { get; init; }

    /// <summary>Current count of consecutive failed login attempts.</summary>
    public int FailedLoginAttempts { get; init; }

    /// <summary>Timestamp of the user's most recent audit log entry, or null if no activity recorded.</summary>
    public DateTime? LastAuditActivity { get; init; }

    // --- Sessions ---

    /// <summary>List of active (non-revoked, non-expired) sessions for the user.</summary>
    public UserSessionDto[] Sessions { get; init; } = [];
}
