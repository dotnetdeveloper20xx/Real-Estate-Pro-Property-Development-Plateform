using System.Text.Json;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.ReactivateUser;

/// <summary>
/// Handles user reactivation by setting IsActive to true
/// and logging an audit entry with old/new IsActive values.
/// </summary>
public sealed class ReactivateUserCommandHandler : IRequestHandler<ReactivateUserCommand, ReactivateUserResult>
{
    private readonly IUserIdentityService _userIdentityService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<ReactivateUserCommandHandler> _logger;

    public ReactivateUserCommandHandler(
        IUserIdentityService userIdentityService,
        IAuditLogService auditLogService,
        ILogger<ReactivateUserCommandHandler> logger)
    {
        _userIdentityService = userIdentityService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<ReactivateUserResult> Handle(ReactivateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Reactivate the user (sets IsActive = true)
        var statusResult = await _userIdentityService.ReactivateUserAsync(
            request.UserId, request.AdminUserId, cancellationToken);

        if (!statusResult.Succeeded)
        {
            _logger.LogWarning(
                "Reactivation failed for user {UserId}: {Errors}",
                request.UserId, string.Join(", ", statusResult.Errors));
            throw new EntityNotFoundException("User", request.UserId);
        }

        // 2. Log audit entry with old/new values
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "UserReactivated",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = request.AdminUserName,
            TargetEntityType = "User",
            TargetEntityId = request.UserId,
            TargetUserName = statusResult.UserDisplayName,
            OldValues = JsonSerializer.Serialize(new { IsActive = statusResult.PreviousIsActive }),
            NewValues = JsonSerializer.Serialize(new { IsActive = true }),
            AffectedFields = "IsActive",
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            Details = "User account reactivated by administrator."
        }, cancellationToken);

        _logger.LogInformation(
            "User {UserId} reactivated by admin {AdminUserId}",
            request.UserId, request.AdminUserId);

        return ReactivateUserResult.Success();
    }
}
