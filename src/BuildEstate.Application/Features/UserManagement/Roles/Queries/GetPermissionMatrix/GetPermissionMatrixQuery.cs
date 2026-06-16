using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Queries.GetPermissionMatrix;

/// <summary>
/// Query to retrieve the full permission matrix.
/// Returns all permissions grouped by domain area × all roles,
/// with granted/not-granted state per cell.
/// </summary>
public sealed record GetPermissionMatrixQuery : IRequest<PermissionMatrixDto>;
