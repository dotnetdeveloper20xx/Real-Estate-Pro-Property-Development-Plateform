using BuildEstate.Application.Features.UserManagement.Users.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Shared.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Queries.GetUserById;

/// <summary>
/// Handles retrieval of a user's full detail information by ID.
/// Delegates to <see cref="IUserQueryService"/> for user lookup,
/// <see cref="ISessionService"/> for active sessions, and
/// <see cref="IAuditLogService"/> for the most recent audit activity.
/// Throws <see cref="NotFoundException"/> if the user does not exist.
/// </summary>
public sealed class GetUserByIdQueryHandler
    : IRequestHandler<GetUserByIdQuery, UserDetailDto>
{
    private readonly IUserQueryService _userQueryService;

    public GetUserByIdQueryHandler(IUserQueryService userQueryService)
    {
        _userQueryService = userQueryService;
    }

    public async Task<UserDetailDto> Handle(
        GetUserByIdQuery request,
        CancellationToken cancellationToken)
    {
        var userDetail = await _userQueryService.GetUserByIdAsync(
            request.UserId,
            cancellationToken);

        if (userDetail is null)
        {
            throw new NotFoundException($"User with ID '{request.UserId}' was not found.");
        }

        return userDetail;
    }
}
