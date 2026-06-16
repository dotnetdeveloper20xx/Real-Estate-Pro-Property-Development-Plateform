using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using BuildEstate.Application.Interfaces;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoles;

/// <summary>
/// Handles retrieval of a paginated, searchable list of roles.
/// Delegates to <see cref="IRoleQueryService"/> for data access, maintaining
/// separation between Application and Infrastructure layers.
/// </summary>
public sealed class GetRolesQueryHandler
    : IRequestHandler<GetRolesQuery, PagedResult<RoleListItemDto>>
{
    private readonly IRoleQueryService _roleQueryService;

    public GetRolesQueryHandler(IRoleQueryService roleQueryService)
    {
        _roleQueryService = roleQueryService;
    }

    public async Task<PagedResult<RoleListItemDto>> Handle(
        GetRolesQuery request,
        CancellationToken cancellationToken)
    {
        return await _roleQueryService.GetRolesAsync(
            request.Page,
            request.PageSize,
            request.SearchTerm,
            cancellationToken);
    }
}
