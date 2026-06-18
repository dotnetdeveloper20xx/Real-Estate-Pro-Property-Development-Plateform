using Microsoft.AspNetCore.Authorization;

namespace BuildEstate.Application.Authorization;

/// <summary>
/// Authorization requirement that demands a specific permission claim be present
/// on the authenticated user's principal. Used with policy-based authorization
/// to enforce fine-grained permission checks beyond role-based access.
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The permission name required (e.g., "opportunities.create").
    /// </summary>
    public string Permission { get; }

    public PermissionRequirement(string permission) => Permission = permission;
}
