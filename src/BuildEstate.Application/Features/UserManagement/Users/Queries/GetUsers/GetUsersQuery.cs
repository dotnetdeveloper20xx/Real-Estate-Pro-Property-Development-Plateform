using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Users.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;

/// <summary>
/// Query to retrieve a paginated, searchable, and filterable list of users.
/// Supports pagination with configurable page sizes (10, 25, 50),
/// case-insensitive search across FirstName, LastName, and Email,
/// and status filtering (All, Active, Inactive).
/// </summary>
public sealed record GetUsersQuery : IRequest<PagedResult<UserListItemDto>>
{
    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int Page { get; init; } = 1;

    /// <summary>Number of items per page. Valid values: 10, 25, 50. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>
    /// Optional search term for case-insensitive filtering by FirstName, LastName, or Email.
    /// Debounce is handled on the frontend; backend processes immediately.
    /// </summary>
    public string? SearchTerm { get; init; }

    /// <summary>
    /// Status filter for users. Defaults to All (no status filtering).
    /// </summary>
    public UserStatusFilter StatusFilter { get; init; } = UserStatusFilter.All;
}
