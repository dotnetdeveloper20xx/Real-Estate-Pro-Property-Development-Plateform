using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using BuildEstate.Application.Interfaces;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Queries.GetPermissionMatrix;

/// <summary>
/// Handles retrieval of the full permission matrix.
/// Delegates to <see cref="IRoleQueryService"/> for data access.
/// </summary>
public sealed class GetPermissionMatrixQueryHandler
    : IRequestHandler<GetPermissionMatrixQuery, PermissionMatrixDto>
{
    private readonly IRoleQueryService _roleQueryService;

    public GetPermissionMatrixQueryHandler(IRoleQueryService roleQueryService)
    {
        _roleQueryService = roleQueryService;
    }

    public async Task<PermissionMatrixDto> Handle(
        GetPermissionMatrixQuery request,
        CancellationToken cancellationToken)
    {
        return await _roleQueryService.GetPermissionMatrixAsync(cancellationToken);
    }
}
