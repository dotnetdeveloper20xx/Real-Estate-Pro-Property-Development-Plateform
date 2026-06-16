using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Sessions.Commands.RevokeAllSessions;

/// <summary>
/// Handles revoking all sessions for a user except the current session.
/// Retrieves active sessions, revokes each one individually (skipping current),
/// and logs an audit entry for the bulk operation.
/// </summary>
public sealed class RevokeAllSessionsCommandHandler
    : IRequestHandler<RevokeAllSessionsCommand, RevokeAllSessionsResult>
{
    private readonly ISessionService _sessionService;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<RevokeAllSessionsCommandHandler> _logger;

    public RevokeAllSessionsCommandHandler(
        ISessionService sessionService,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ILogger<RevokeAllSessionsCommandHandler> logger)
    {
        _sessionService = sessionService;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<RevokeAllSessionsResult> Handle(
        RevokeAllSessionsCommand request,
        CancellationToken cancellationToken)
    {
        // Get all active sessions for this user
        var activeSessions = await _sessionService.GetActiveSessionsAsync(
            request.UserId, cancellationToken);

        // Filter out the current session
        var sessionsToRevoke = activeSessions
            .Where(s => s.Id != request.CurrentSessionId)
            .ToList();

        if (sessionsToRevoke.Count == 0)
        {
            return RevokeAllSessionsResult.Success(0);
        }

        // Revoke each session except the current one
        foreach (var session in sessionsToRevoke)
        {
            await _sessionService.RevokeSessionAsync(
                session.Id, "All other sessions revoked by administrator", cancellationToken);
        }

        // Log audit entry
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "AllSessionsRevoked",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = request.AdminUserName,
            TargetEntityType = "User",
            TargetEntityId = request.UserId,
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            Details = $"Revoked {sessionsToRevoke.Count} session(s), excluding current session"
        }, cancellationToken);

        _logger.LogInformation(
            "Revoked {Count} sessions for user {UserId} by admin {AdminUserId} (current session excluded)",
            sessionsToRevoke.Count, request.UserId, request.AdminUserId);

        return RevokeAllSessionsResult.Success(sessionsToRevoke.Count);
    }
}
