namespace BuildEstate.Domain.Entities.UserManagement;

/// <summary>
/// Join entity representing the many-to-many relationship between roles and permissions.
/// Uses a composite key of (RoleId, PermissionId).
/// </summary>
public class RolePermission
{
    /// <summary>
    /// The Identity role ID (FK to AspNetRoles).
    /// </summary>
    public string RoleId { get; set; } = string.Empty;

    /// <summary>
    /// The permission ID (FK to Permissions).
    /// </summary>
    public Guid PermissionId { get; set; }

    // Navigation
    public Permission Permission { get; set; } = null!;
}
