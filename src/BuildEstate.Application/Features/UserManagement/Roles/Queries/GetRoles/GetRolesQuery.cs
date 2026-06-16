using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoles;

/// <summary>
/// Query to retrieve a paginated, searchable list of roles.
/// Supports pagination with configurable page sizes (10, 25, 50)
/// and case-insensitive search across Name and Description.
/// </summary>
public sealed record GetRolesQuery : IRequest<PagedResult<RoleListItemDto>>
{
    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int Page { get; init; } = 1;

    /// <summary>Number of items per page. Valid values: 10, 25, 50. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>
    /// Optional search term for case-insensitive filtering by Name or Description.
    /// Debounce is handled on the frontend; backend processes immediately.
    /// </summary>
    public string? SearchTerm { get; init; }
}
