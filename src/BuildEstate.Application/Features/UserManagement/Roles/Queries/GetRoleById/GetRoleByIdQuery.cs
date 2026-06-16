using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoleById;

/// <summary>
/// Query to retrieve a role's full detail including assigned permissions by ID.
/// Returns the role detail DTO or throws a NotFoundException if not found.
/// </summary>
public sealed record GetRoleByIdQuery : IRequest<RoleDetailDto>
{
    /// <summary>The unique identifier of the role to retrieve.</summary>
    public string RoleId { get; init; } = string.Empty;
}
