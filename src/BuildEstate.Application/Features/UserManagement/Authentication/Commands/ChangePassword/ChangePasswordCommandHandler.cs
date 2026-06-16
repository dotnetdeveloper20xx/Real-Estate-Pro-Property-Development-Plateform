using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.ChangePassword;

/// <summary>
/// Handles the ChangePasswordCommand by:
/// 1. Verifying the current password
/// 2. Checking password history (last 5) for reuse
/// 3. Changing the password via Identity
/// 4. Recording the new password hash in history
/// 5. Revoking all user sessions
/// 6. Logging an audit entry
/// </summary>
public sealed class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, ChangePasswordResult>
{
    private readonly IUserIdentityService _userIdentityService;
    private readonly IPasswordHistoryService _passwordHistoryService;
    private readonly ISessionService _sessionService;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<ChangePasswordCommandHandler> _logger;

    public ChangePasswordCommandHandler(
        IUserIdentityService userIdentityService,
        IPasswordHistoryService passwordHistoryService,
        ISessionService sessionService,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ILogger<ChangePasswordCommandHandler> logger)
    {
        _userIdentityService = userIdentityService;
        _passwordHistoryService = passwordHistoryService;
        _sessionService = sessionService;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<ChangePasswordResult> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify user exists and is active
        var userExists = await _userIdentityService.UserExistsAndIsActiveAsync(request.UserId, cancellationToken);
        if (!userExists)
        {
            _logger.LogWarning("Password change attempted for non-existent or inactive user {UserId}", request.UserId);
            return ChangePasswordResult.Failure("User not found or account is inactive.");
        }

        // 2. Verify current password
        var currentPasswordValid = await _userIdentityService.VerifyPasswordAsync(
            request.UserId, request.CurrentPassword, cancellationToken);

        if (!currentPasswordValid)
        {
            _logger.LogWarning("Password change failed for user {UserId}: current password incorrect", request.UserId);
            return ChangePasswordResult.Failure("Current password is incorrect.");
        }

        // 3. Check password history (last 5) for reuse
        var isReused = await _passwordHistoryService.IsPasswordReusedAsync(
            request.UserId, request.NewPassword, cancellationToken);

        if (isReused)
        {
            _logger.LogWarning("Password change rejected for user {UserId}: password matches history", request.UserId);
            return ChangePasswordResult.Failure("New password cannot be the same as any of your last 5 passwords.");
        }

        // 4. Change the password via Identity
        var changeResult = await _userIdentityService.ChangePasswordAsync(
            request.UserId, request.CurrentPassword, request.NewPassword, cancellationToken);

        if (!changeResult.Succeeded)
        {
            _logger.LogWarning(
                "Password change failed for user {UserId}: {Errors}",
                request.UserId, string.Join(", ", changeResult.Errors));
            return ChangePasswordResult.Failure(string.Join(" ", changeResult.Errors));
        }

        // 5. Record the new password hash in history
        var newPasswordHash = await _userIdentityService.GetPasswordHashAsync(request.UserId, cancellationToken);
        if (newPasswordHash is not null)
        {
            await _passwordHistoryService.RecordPasswordChangeAsync(
                request.UserId, newPasswordHash, cancellationToken);
        }

        // 6. Revoke all user sessions and tokens
        await _sessionService.RevokeAllUserSessionsAsync(
            request.UserId, "Password changed", cancellationToken);
        await _tokenService.RevokeAllUserTokensAsync(request.UserId, cancellationToken);

        // 7. Log audit entry
        var displayName = await _userIdentityService.GetUserDisplayNameAsync(request.UserId, cancellationToken);
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "PasswordChanged",
            PerformedByUserId = request.UserId,
            PerformedByUserName = displayName ?? "Unknown",
            TargetEntityType = "User",
            TargetEntityId = request.UserId,
            TargetUserName = displayName,
            IpAddress = request.IpAddress,
            AffectedFields = "PasswordHash",
            CorrelationId = request.CorrelationId,
            Details = "User changed their own password."
        }, cancellationToken);

        _logger.LogInformation(
            "Password changed successfully for user {UserId}", request.UserId);

        return ChangePasswordResult.Success();
    }
}
