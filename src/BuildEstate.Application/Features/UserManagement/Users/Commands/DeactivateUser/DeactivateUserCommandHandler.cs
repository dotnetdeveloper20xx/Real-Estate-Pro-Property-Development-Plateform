using System.Text.Json;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.DeactivateUser;

/// <summary>
/// Handles user deactivation by setting IsActive to false, revoking all sessions
/// and tokens (with up to 3 retries on failure), and logging an audit entry
/// with old/new IsActive values.
/// </summary>
public sealed class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand, DeactivateUserResult>
{
    private const int MaxRevocationRetries = 3;

    private readonly IUserIdentityService _userIdentityService;
    private readonly ISessionService _sessionService;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<DeactivateUserCommandHandler> _logger;

    public DeactivateUserCommandHandler(
        IUserIdentityService userIdentityService,
        ISessionService sessionService,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ILogger<DeactivateUserCommandHandler> logger)
    {
        _userIdentityService = userIdentityService;
        _sessionService = sessionService;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<DeactivateUserResult> Handle(DeactivateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Deactivate the user (sets IsActive = false)
        var statusResult = await _userIdentityService.DeactivateUserAsync(
            request.UserId, request.AdminUserId, cancellationToken);

        if (!statusResult.Succeeded)
        {
            _logger.LogWarning(
                "Deactivation failed for user {UserId}: {Errors}",
                request.UserId, string.Join(", ", statusResult.Errors));
            throw new EntityNotFoundException("User", request.UserId);
        }

        // 2. Revoke all sessions with retry (up to 3 attempts)
        var sessionRevocationFailed = false;
        string? revocationError = null;

        for (var attempt = 1; attempt <= MaxRevocationRetries; attempt++)
        {
            try
            {
                await _sessionService.RevokeAllUserSessionsAsync(
                    request.UserId, "Account deactivated", cancellationToken);
                await _tokenService.RevokeAllUserTokensAsync(request.UserId, cancellationToken);

                _logger.LogInformation(
                    "All sessions and tokens revoked for deactivated user {UserId} on attempt {Attempt}",
                    request.UserId, attempt);

                sessionRevocationFailed = false;
                revocationError = null;
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Session revocation attempt {Attempt}/{MaxRetries} failed for user {UserId}",
                    attempt, MaxRevocationRetries, request.UserId);

                sessionRevocationFailed = true;
                revocationError = $"Session revocation failed after {attempt} attempt(s): {ex.Message}";

                if (attempt < MaxRevocationRetries)
                {
                    await Task.Delay(100 * attempt, cancellationToken);
                }
            }
        }

        // 3. Log audit entry with old/new values
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "UserDeactivated",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = request.AdminUserName,
            TargetEntityType = "User",
            TargetEntityId = request.UserId,
            TargetUserName = statusResult.UserDisplayName,
            OldValues = JsonSerializer.Serialize(new { IsActive = statusResult.PreviousIsActive }),
            NewValues = JsonSerializer.Serialize(new { IsActive = false }),
            AffectedFields = "IsActive",
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            Details = "User account deactivated by administrator."
        }, cancellationToken);

        _logger.LogInformation(
            "User {UserId} deactivated by admin {AdminUserId}",
            request.UserId, request.AdminUserId);

        if (sessionRevocationFailed)
        {
            return DeactivateUserResult.SuccessWithSessionRevocationWarning(revocationError!);
        }

        return DeactivateUserResult.Success();
    }
}
