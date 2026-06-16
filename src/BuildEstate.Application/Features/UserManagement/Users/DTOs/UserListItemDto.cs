namespace BuildEstate.Application.Features.UserManagement.Users.DTOs;

/// <summary>
/// Data transfer object for user list items displayed in the paginated user table.
/// Contains essential user information including assigned roles for badge display.
/// </summary>
public sealed record UserListItemDto
{
    /// <summary>The user's unique identifier.</summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>The user's first name.</summary>
    public string FirstName { get; init; } = string.Empty;

    /// <summary>The user's last name.</summary>
    public string LastName { get; init; } = string.Empty;

    /// <summary>The user's email address.</summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>List of role names assigned to the user.</summary>
    public string[] Roles { get; init; } = [];

    /// <summary>Whether the user account is active.</summary>
    public bool IsActive { get; init; }

    /// <summary>Timestamp of the user's most recent successful login, or null if never logged in.</summary>
    public DateTime? LastLoginAt { get; init; }
}
