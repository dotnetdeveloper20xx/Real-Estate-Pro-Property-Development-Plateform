using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Sessions.Commands.RevokeSession;

/// <summary>
/// Handles revoking a specific session. Validates that the target session is not the current session,
/// revokes the session via ISessionService, and logs an audit entry.
/// </summary>
public sealed class RevokeSessionCommandHandler
    : IRequestHandler<RevokeSessionCommand, RevokeSessionResult>
{
    private readonly ISessionService _sessionService;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<RevokeSessionCommandHandler> _logger;

    public RevokeSessionCommandHandler(
        ISessionService sessionService,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ILogger<RevokeSessionCommandHandler> logger)
    {
        _sessionService = sessionService;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<RevokeSessionResult> Handle(
        RevokeSessionCommand request,
        CancellationToken cancellationToken)
    {
        // Prevent revoking the current session
        if (request.SessionId == request.CurrentSessionId)
        {
            _logger.LogWarning(
                "Attempt to revoke current session {SessionId} by admin {AdminUserId}",
                request.SessionId, request.AdminUserId);

            return RevokeSessionResult.Failure("Cannot revoke the current session.");
        }

        // Revoke the session (marks it as revoked with reason)
        await _sessionService.RevokeSessionAsync(
            request.SessionId, "Admin revoked session", cancellationToken);

        // Log audit entry
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "SessionRevoked",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = request.AdminUserName,
            TargetEntityType = "UserSession",
            TargetEntityId = request.SessionId.ToString(),
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            Details = "Individual session revoked by administrator"
        }, cancellationToken);

        _logger.LogInformation(
            "Session {SessionId} revoked by admin {AdminUserId}",
            request.SessionId, request.AdminUserId);

        return RevokeSessionResult.Success();
    }
}
