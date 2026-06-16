namespace BuildEstate.Application.Features.UserManagement.Roles.DTOs;

/// <summary>
/// Data transfer object representing the full permission matrix:
/// all permissions grouped by domain × all roles, with granted/not-granted per cell.
/// </summary>
public sealed record PermissionMatrixDto
{
    /// <summary>All roles in the system (columns of the matrix).</summary>
    public PermissionMatrixRoleDto[] Roles { get; init; } = [];

    /// <summary>All permissions grouped by domain area (rows of the matrix).</summary>
    public PermissionGroupDto[] PermissionGroups { get; init; } = [];

    /// <summary>All cells indicating which role has which permission granted.</summary>
    public PermissionMatrixCellDto[] Cells { get; init; } = [];
}

/// <summary>
/// A role column in the permission matrix.
/// </summary>
public sealed record PermissionMatrixRoleDto
{
    /// <summary>The role's unique identifier.</summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>The role name.</summary>
    public string Name { get; init; } = string.Empty;
}

/// <summary>
/// A group of permissions within a single domain area.
/// </summary>
public sealed record PermissionGroupDto
{
    /// <summary>The domain area name (e.g., "Opportunities", "Finance").</summary>
    public string DomainArea { get; init; } = string.Empty;

    /// <summary>Permissions belonging to this domain area.</summary>
    public PermissionItemDto[] Permissions { get; init; } = [];
}

/// <summary>
/// A single cell in the permission matrix representing whether a role has a specific permission.
/// </summary>
public sealed record PermissionMatrixCellDto
{
    /// <summary>The role's unique identifier.</summary>
    public string RoleId { get; init; } = string.Empty;

    /// <summary>The permission's unique identifier.</summary>
    public Guid PermissionId { get; init; }

    /// <summary>Whether the permission is granted to this role.</summary>
    public bool IsGranted { get; init; }
}
