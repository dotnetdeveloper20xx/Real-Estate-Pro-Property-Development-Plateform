using BuildEstate.Application.Features.UserManagement.Users.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Queries.GetUserById;

/// <summary>
/// Query to retrieve a single user's full details by their unique identifier.
/// Returns comprehensive user data including security summary, sessions, and assigned roles.
/// Throws NotFoundException if the user does not exist.
/// </summary>
public sealed record GetUserByIdQuery : IRequest<UserDetailDto>
{
    /// <summary>The unique identifier of the user to retrieve.</summary>
    public string UserId { get; init; } = string.Empty;
}
