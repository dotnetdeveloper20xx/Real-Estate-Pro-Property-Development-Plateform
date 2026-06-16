using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using BuildEstate.Application.Interfaces;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoleById;

/// <summary>
/// Handles retrieval of a role's full detail including assigned permissions.
/// Delegates to <see cref="IRoleQueryService"/> for data access.
/// Throws a <see cref="KeyNotFoundException"/> if the role is not found.
/// </summary>
public sealed class GetRoleByIdQueryHandler
    : IRequestHandler<GetRoleByIdQuery, RoleDetailDto>
{
    private readonly IRoleQueryService _roleQueryService;

    public GetRoleByIdQueryHandler(IRoleQueryService roleQueryService)
    {
        _roleQueryService = roleQueryService;
    }

    public async Task<RoleDetailDto> Handle(
        GetRoleByIdQuery request,
        CancellationToken cancellationToken)
    {
        var role = await _roleQueryService.GetRoleByIdAsync(request.RoleId, cancellationToken);

        if (role is null)
        {
            throw new KeyNotFoundException($"Role with ID '{request.RoleId}' was not found.");
        }

        return role;
    }
}
