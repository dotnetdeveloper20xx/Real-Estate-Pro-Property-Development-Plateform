namespace BuildEstate.Domain.Entities.UserManagement;

/// <summary>
/// Represents a granular permission that can be assigned to roles.
/// Permissions follow the pattern "domainArea.action" (e.g., "opportunities.create").
/// </summary>
public class Permission
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Machine-readable permission name (e.g., "opportunities.create").
    /// Must be unique across the system.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable display name (e.g., "Create Opportunities").
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// The domain area this permission belongs to (e.g., "Opportunities", "Finance").
    /// Used for grouping in the permission matrix UI.
    /// </summary>
    public string DomainArea { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of what this permission grants.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
