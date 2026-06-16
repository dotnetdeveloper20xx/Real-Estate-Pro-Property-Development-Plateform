using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.ResetPassword;

/// <summary>
/// Handles the admin-initiated ResetPasswordCommand by:
/// 1. Verifying the target user exists and is active
/// 2. Checking password history (last 5) for reuse
/// 3. Resetting the password via Identity (generate token + reset)
/// 4. Recording the new password hash in history
/// 5. Revoking all user sessions and tokens
/// 6. Logging an audit entry
/// </summary>
public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, ResetPasswordResult>
{
    private readonly IUserIdentityService _userIdentityService;
    private readonly IPasswordHistoryService _passwordHistoryService;
    private readonly ISessionService _sessionService;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<ResetPasswordCommandHandler> _logger;

    public ResetPasswordCommandHandler(
        IUserIdentityService userIdentityService,
        IPasswordHistoryService passwordHistoryService,
        ISessionService sessionService,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ILogger<ResetPasswordCommandHandler> logger)
    {
        _userIdentityService = userIdentityService;
        _passwordHistoryService = passwordHistoryService;
        _sessionService = sessionService;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<ResetPasswordResult> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify target user exists and is active
        var userExists = await _userIdentityService.UserExistsAndIsActiveAsync(request.UserId, cancellationToken);
        if (!userExists)
        {
            _logger.LogWarning(
                "Admin password reset attempted for non-existent or inactive user {UserId} by admin {AdminUserId}",
                request.UserId, request.AdminUserId);
            return ResetPasswordResult.Failure("User not found or account is inactive.");
        }

        // 2. Check password history (last 5) for reuse
        var isReused = await _passwordHistoryService.IsPasswordReusedAsync(
            request.UserId, request.NewPassword, cancellationToken);

        if (isReused)
        {
            _logger.LogWarning(
                "Admin password reset rejected for user {UserId}: password matches history. Admin: {AdminUserId}",
                request.UserId, request.AdminUserId);
            return ResetPasswordResult.Failure("New password cannot be the same as any of the user's last 5 passwords.");
        }

        // 3. Reset the password via Identity (generates token internally)
        var resetResult = await _userIdentityService.ResetPasswordAsync(
            request.UserId, request.NewPassword, cancellationToken);

        if (!resetResult.Succeeded)
        {
            _logger.LogWarning(
                "Admin password reset failed for user {UserId}: {Errors}. Admin: {AdminUserId}",
                request.UserId, string.Join(", ", resetResult.Errors), request.AdminUserId);
            return ResetPasswordResult.Failure(string.Join(" ", resetResult.Errors));
        }

        // 4. Record the new password hash in history
        var newPasswordHash = await _userIdentityService.GetPasswordHashAsync(request.UserId, cancellationToken);
        if (newPasswordHash is not null)
        {
            await _passwordHistoryService.RecordPasswordChangeAsync(
                request.UserId, newPasswordHash, cancellationToken);
        }

        // 5. Revoke all user sessions and tokens
        await _sessionService.RevokeAllUserSessionsAsync(
            request.UserId, "Password reset by administrator", cancellationToken);
        await _tokenService.RevokeAllUserTokensAsync(request.UserId, cancellationToken);

        // 6. Log audit entry
        var targetDisplayName = await _userIdentityService.GetUserDisplayNameAsync(request.UserId, cancellationToken);
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "PasswordResetByAdmin",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = request.AdminUserName,
            TargetEntityType = "User",
            TargetEntityId = request.UserId,
            TargetUserName = targetDisplayName,
            IpAddress = request.IpAddress,
            AffectedFields = "PasswordHash",
            CorrelationId = request.CorrelationId,
            Details = $"Password reset by administrator {request.AdminUserName}."
        }, cancellationToken);

        _logger.LogInformation(
            "Password reset successfully for user {UserId} by admin {AdminUserId}",
            request.UserId, request.AdminUserId);

        return ResetPasswordResult.Success();
    }
}
