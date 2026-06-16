namespace BuildEstate.Application.Features.UserManagement.Authentication.DTOs;

/// <summary>
/// DTO representing the current authenticated user's profile information.
/// Returned by the GET /auth/me endpoint to provide the frontend with identity context.
/// </summary>
public sealed record CurrentUserDto
{
    /// <summary>
    /// The user's unique identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// The user's first name.
    /// </summary>
    public string FirstName { get; init; } = string.Empty;

    /// <summary>
    /// The user's last name.
    /// </summary>
    public string LastName { get; init; } = string.Empty;

    /// <summary>
    /// The user's email address.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// The role names assigned to the user.
    /// </summary>
    public string[] Roles { get; init; } = [];

    /// <summary>
    /// The permission names granted to the user through their assigned roles.
    /// </summary>
    public string[] Permissions { get; init; } = [];
}
