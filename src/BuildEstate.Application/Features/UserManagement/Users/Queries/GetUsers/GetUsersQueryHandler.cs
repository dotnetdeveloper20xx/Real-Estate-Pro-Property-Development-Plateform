using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Users.DTOs;
using BuildEstate.Application.Interfaces;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;

/// <summary>
/// Handles retrieval of a paginated, searchable, and filterable list of users.
/// Delegates to <see cref="IUserQueryService"/> for data access, maintaining
/// separation between Application and Infrastructure layers.
/// </summary>
public sealed class GetUsersQueryHandler
    : IRequestHandler<GetUsersQuery, PagedResult<UserListItemDto>>
{
    private readonly IUserQueryService _userQueryService;

    public GetUsersQueryHandler(IUserQueryService userQueryService)
    {
        _userQueryService = userQueryService;
    }

    public async Task<PagedResult<UserListItemDto>> Handle(
        GetUsersQuery request,
        CancellationToken cancellationToken)
    {
        return await _userQueryService.GetUsersAsync(
            request.Page,
            request.PageSize,
            request.SearchTerm,
            request.StatusFilter,
            cancellationToken);
    }
}
