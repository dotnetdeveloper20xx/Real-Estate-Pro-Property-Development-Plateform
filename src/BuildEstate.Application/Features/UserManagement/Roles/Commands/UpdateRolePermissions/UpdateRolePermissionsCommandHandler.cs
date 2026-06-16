using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRolePermissions;

/// <summary>
/// Handles permission toggling for a role by:
/// 1. Toggling the permission on/off via IRoleManagementService
/// 2. Revoking all sessions for users assigned to that role (immediate enforcement)
/// 3. Logging an audit entry documenting the change
/// </summary>
public sealed class UpdateRolePermissionsCommandHandler
    : IRequestHandler<UpdateRolePermissionsCommand, UpdateRolePermissionsCommandResult>
{
    private readonly IRoleManagementService _roleManagementService;
    private readonly ISessionService _sessionService;
    private readonly IUserIdentityService _userIdentityService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<UpdateRolePermissionsCommandHandler> _logger;

    public UpdateRolePermissionsCommandHandler(
        IRoleManagementService roleManagementService,
        ISessionService sessionService,
        IUserIdentityService userIdentityService,
        IAuditLogService auditLogService,
        ILogger<UpdateRolePermissionsCommandHandler> logger)
    {
        _roleManagementService = roleManagementService;
        _sessionService = sessionService;
        _userIdentityService = userIdentityService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<UpdateRolePermissionsCommandResult> Handle(
        UpdateRolePermissionsCommand request, CancellationToken cancellationToken)
    {
        // 1. Toggle the permission
        var toggleResult = await _roleManagementService.TogglePermissionAsync(
            request.RoleId, request.PermissionId, cancellationToken);

        if (!toggleResult.Succeeded)
        {
            _logger.LogWarning(
                "Permission toggle failed for role {RoleId}, permission {PermissionId}: {Errors}",
                request.RoleId, request.PermissionId, string.Join(", ", toggleResult.Errors));
            return UpdateRolePermissionsCommandResult.Failure(toggleResult.Errors);
        }

        // 2. Revoke all sessions for users assigned to this role
        await _sessionService.RevokeSessionsForRoleAsync(
            request.RoleId, "Role permissions changed", cancellationToken);

        _logger.LogInformation(
            "Sessions revoked for all users assigned to role {RoleId} due to permission change",
            request.RoleId);

        // 3. Log audit entry
        var adminDisplayName = await _userIdentityService.GetUserDisplayNameAsync(
            request.AdminUserId, cancellationToken);
        var roleName = await _roleManagementService.GetRoleNameAsync(request.RoleId, cancellationToken);

        var action = toggleResult.IsGranted ? "granted to" : "revoked from";

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "RolePermissionChanged",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = adminDisplayName ?? "System",
            TargetEntityType = "Role",
            TargetEntityId = request.RoleId,
            IpAddress = request.IpAddress,
            NewValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                PermissionId = request.PermissionId,
                IsGranted = toggleResult.IsGranted
            }),
            AffectedFields = "Permissions",
            CorrelationId = request.CorrelationId,
            Details = $"Permission {request.PermissionId} {action} role '{roleName}'."
        }, cancellationToken);

        _logger.LogInformation(
            "Permission {PermissionId} {Action} role {RoleId} ('{RoleName}') by admin {AdminUserId}",
            request.PermissionId, action, request.RoleId, roleName, request.AdminUserId);

        return UpdateRolePermissionsCommandResult.Success(toggleResult.IsGranted);
    }
}
