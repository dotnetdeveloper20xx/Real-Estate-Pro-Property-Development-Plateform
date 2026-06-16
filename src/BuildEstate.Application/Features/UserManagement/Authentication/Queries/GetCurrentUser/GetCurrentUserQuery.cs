using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Queries.GetCurrentUser;

/// <summary>
/// Query to retrieve the current authenticated user's profile information
/// including identity details, assigned roles, and aggregated permissions.
/// The UserId is extracted from JWT claims by the controller.
/// </summary>
public sealed record GetCurrentUserQuery : IRequest<CurrentUserDto>
{
    /// <summary>
    /// The authenticated user's unique identifier, extracted from JWT claims.
    /// </summary>
    public string UserId { get; init; } = string.Empty;
}
