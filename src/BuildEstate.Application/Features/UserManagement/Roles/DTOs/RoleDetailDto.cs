namespace BuildEstate.Application.Features.UserManagement.Roles.DTOs;

/// <summary>
/// Data transfer object for a role detail view including assigned permissions.
/// Extends the list item information with the full permissions list.
/// </summary>
public sealed record RoleDetailDto
{
    /// <summary>The role's unique identifier.</summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>The role name.</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>The role description.</summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>Number of users currently assigned to this role.</summary>
    public int UserCount { get; init; }

    /// <summary>Whether this is a system-defined built-in role that cannot be deleted or renamed.</summary>
    public bool IsBuiltIn { get; init; }

    /// <summary>List of permissions assigned to this role.</summary>
    public PermissionItemDto[] Permissions { get; init; } = [];
}
