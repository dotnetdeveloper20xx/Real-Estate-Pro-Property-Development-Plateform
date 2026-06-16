using System.ComponentModel.DataAnnotations;
using BuildEstate.Domain.Entities.UserManagement;
using Microsoft.AspNetCore.Identity;

namespace BuildEstate.Infrastructure.Identity;

/// <summary>
/// Extended Identity role with metadata for built-in role protection and permission assignment.
/// </summary>
public class ApplicationRole : IdentityRole
{
    [MaxLength(256)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether this role is a system-defined built-in role that cannot be deleted or renamed.
    /// </summary>
    public bool IsBuiltIn { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
