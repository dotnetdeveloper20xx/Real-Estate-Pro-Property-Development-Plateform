using BuildEstate.Application.Features.UserManagement.Sessions.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Sessions.Queries.GetUserSessions;

/// <summary>
/// Query to retrieve all sessions for a given user.
/// Returns sessions with device, location, IP, last active, and status information.
/// The current session is identified by matching the CurrentSessionId.
/// </summary>
public sealed record GetUserSessionsQuery : IRequest<GetUserSessionsResult>
{
    /// <summary>The user ID whose sessions to retrieve.</summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// The session ID of the requesting user's current session.
    /// Used to mark which session is "Current" (cannot be revoked).
    /// </summary>
    public Guid? CurrentSessionId { get; init; }
}

/// <summary>
/// Result containing the list of sessions for the requested user.
/// </summary>
public sealed record GetUserSessionsResult
{
    public IReadOnlyList<SessionDto> Sessions { get; init; } = Array.Empty<SessionDto>();
}
