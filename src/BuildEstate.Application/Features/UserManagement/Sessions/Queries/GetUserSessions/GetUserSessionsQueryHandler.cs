using BuildEstate.Application.Features.UserManagement.Sessions.DTOs;
using BuildEstate.Application.Interfaces;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Sessions.Queries.GetUserSessions;

/// <summary>
/// Handles retrieval of user sessions via ISessionService.
/// Maps domain UserSession entities to SessionDto with status determination.
/// </summary>
public sealed class GetUserSessionsQueryHandler
    : IRequestHandler<GetUserSessionsQuery, GetUserSessionsResult>
{
    private readonly ISessionService _sessionService;

    public GetUserSessionsQueryHandler(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    public async Task<GetUserSessionsResult> Handle(
        GetUserSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await _sessionService.GetActiveSessionsAsync(
            request.UserId, cancellationToken);

        var sessionDtos = sessions.Select(s => new SessionDto
        {
            Id = s.Id,
            DeviceInfo = s.DeviceInfo,
            Browser = s.Browser,
            OperatingSystem = s.OperatingSystem,
            IpAddress = s.IpAddress,
            City = s.City,
            Country = s.Country,
            LastActiveAt = s.LastActiveAt,
            IsCurrent = request.CurrentSessionId.HasValue && s.Id == request.CurrentSessionId.Value,
            Status = DetermineStatus(s.Id, request.CurrentSessionId, s.ExpiresAt, s.IsRevoked)
        }).ToList();

        return new GetUserSessionsResult { Sessions = sessionDtos };
    }

    /// <summary>
    /// Determines the display status of a session.
    /// - "Current": the session matches the requesting user's current session ID
    /// - "Expired": the session has passed its expiration time
    /// - "Active": the session is valid and not current
    /// </summary>
    private static string DetermineStatus(Guid sessionId, Guid? currentSessionId, DateTime expiresAt, bool isRevoked)
    {
        if (currentSessionId.HasValue && sessionId == currentSessionId.Value)
            return "Current";

        if (isRevoked)
            return "Revoked";

        if (expiresAt <= DateTime.UtcNow)
            return "Expired";

        return "Active";
    }
}
