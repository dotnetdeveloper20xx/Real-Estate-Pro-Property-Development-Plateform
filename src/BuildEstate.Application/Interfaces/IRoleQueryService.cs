using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Roles.DTOs;

namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Abstracts role and permission query operations for the Application layer.
/// Enables paginated, searchable role listing, role detail retrieval,
/// and permission matrix generation without direct dependency on
/// Infrastructure Identity types.
/// </summary>
public interface IRoleQueryService
{
    /// <summary>
    /// Retrieves a paginated list of roles with optional search by name/description.
    /// Each role includes the count of users assigned to it.
    /// </summary>
    /// <param name="page">1-based page number.</param>
    /// <param name="pageSize">Number of items per page (10, 25, or 50).</param>
    /// <param name="searchTerm">Optional case-insensitive search term for name/description.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Paginated result of role list items with user counts.</returns>
    Task<PagedResult<RoleListItemDto>> GetRolesAsync(
        int page,
        int pageSize,
        string? searchTerm,
        CancellationToken ct = default);

    /// <summary>
    /// Retrieves full role detail including assigned permissions by role ID.
    /// Returns null if the role is not found.
    /// </summary>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A <see cref="RoleDetailDto"/> with full detail, or null if not found.</returns>
    Task<RoleDetailDto?> GetRoleByIdAsync(string roleId, CancellationToken ct = default);

    /// <summary>
    /// Retrieves the full permission matrix: all permissions grouped by domain
    /// crossed with all roles, indicating granted/not-granted state per cell.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A <see cref="PermissionMatrixDto"/> representing the complete matrix.</returns>
    Task<PermissionMatrixDto> GetPermissionMatrixAsync(CancellationToken ct = default);
}
