namespace BuildEstate.Application.Features.UserManagement.Roles.DTOs;

/// <summary>
/// Data transfer object for a single permission item.
/// Used in role detail views and the permission matrix.
/// </summary>
public sealed record PermissionItemDto
{
    /// <summary>The permission's unique identifier.</summary>
    public Guid Id { get; init; }

    /// <summary>Machine-readable permission name (e.g., "opportunities.create").</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>Human-readable display name (e.g., "Create Opportunities").</summary>
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>The domain area this permission belongs to (e.g., "Opportunities").</summary>
    public string DomainArea { get; init; } = string.Empty;
}
