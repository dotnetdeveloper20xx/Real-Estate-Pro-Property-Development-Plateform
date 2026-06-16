using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Queries.GetCurrentUser;

/// <summary>
/// Handles retrieval of the current authenticated user's profile.
/// Delegates to <see cref="IUserIdentityService"/> for user lookup, role retrieval,
/// and permission aggregation. Throws if the user is not found.
/// </summary>
public sealed class GetCurrentUserQueryHandler
    : IRequestHandler<GetCurrentUserQuery, CurrentUserDto>
{
    private readonly IUserIdentityService _userIdentityService;

    public GetCurrentUserQueryHandler(IUserIdentityService userIdentityService)
    {
        _userIdentityService = userIdentityService;
    }

    public async Task<CurrentUserDto> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken)
    {
        var currentUser = await _userIdentityService.GetCurrentUserAsync(
            request.UserId, cancellationToken);

        if (currentUser is null)
        {
            throw new EntityNotFoundException("User", request.UserId);
        }

        return currentUser;
    }
}
