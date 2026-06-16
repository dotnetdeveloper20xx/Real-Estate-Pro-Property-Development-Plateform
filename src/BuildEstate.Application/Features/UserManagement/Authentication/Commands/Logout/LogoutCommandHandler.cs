using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.Logout;

/// <summary>
/// Handles user logout by revoking the current session and refresh token,
/// then recording an immutable audit log entry for the logout action.
/// </summary>
public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, Unit>
{
    private readonly ISessionService _sessionService;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<LogoutCommandHandler> _logger;

    public LogoutCommandHandler(
        ISessionService sessionService,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ILogger<LogoutCommandHandler> logger)
    {
        _sessionService = sessionService;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<Unit> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        // 1. Revoke the current session
        await _sessionService.RevokeSessionAsync(
            request.SessionId, "User logged out", cancellationToken);

        // 2. Revoke the refresh token
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            await _tokenService.RevokeRefreshTokenAsync(request.RefreshToken, cancellationToken);
        }

        // 3. Log audit entry for the logout action
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "UserLogout",
            PerformedByUserId = request.UserId,
            PerformedByUserName = request.UserId, // Caller should provide name if available
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            Details = $"User logged out. Session {request.SessionId} revoked."
        }, cancellationToken);

        _logger.LogInformation(
            "User {UserId} logged out. Session {SessionId} revoked.",
            request.UserId, request.SessionId);

        return Unit.Value;
    }
}
