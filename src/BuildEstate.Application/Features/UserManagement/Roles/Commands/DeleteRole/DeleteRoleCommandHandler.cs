using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.DeleteRole;

/// <summary>
/// Handles role deletion by:
/// 1. Verifying the role is not built-in
/// 2. Checking user count and requiring confirmation if users are assigned
/// 3. Deleting the role via IRoleManagementService
/// 4. Logging an audit entry documenting the deletion
/// </summary>
public sealed class DeleteRoleCommandHandler : IRequestHandler<DeleteRoleCommand, DeleteRoleCommandResult>
{
    private readonly IRoleManagementService _roleManagementService;
    private readonly IUserIdentityService _userIdentityService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<DeleteRoleCommandHandler> _logger;

    public DeleteRoleCommandHandler(
        IRoleManagementService roleManagementService,
        IUserIdentityService userIdentityService,
        IAuditLogService auditLogService,
        ILogger<DeleteRoleCommandHandler> logger)
    {
        _roleManagementService = roleManagementService;
        _userIdentityService = userIdentityService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<DeleteRoleCommandResult> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if role is built-in
        var isBuiltIn = await _roleManagementService.IsBuiltInRoleAsync(request.RoleId, cancellationToken);
        if (isBuiltIn)
        {
            _logger.LogWarning(
                "Attempt to delete built-in role {RoleId} by admin {AdminUserId}",
                request.RoleId, request.AdminUserId);
            return DeleteRoleCommandResult.Failure("Built-in roles cannot be deleted.");
        }

        // 2. Check if users are assigned and confirmation is not provided
        if (!request.ConfirmDeletion)
        {
            var userCount = await _roleManagementService.GetUserCountForRoleAsync(request.RoleId, cancellationToken);
            if (userCount > 0)
            {
                _logger.LogInformation(
                    "Delete role {RoleId} requires confirmation — {UserCount} user(s) assigned",
                    request.RoleId, userCount);
                return DeleteRoleCommandResult.ConfirmationRequired(userCount);
            }
        }

        // 3. Get role name for audit before deletion
        var roleName = await _roleManagementService.GetRoleNameAsync(request.RoleId, cancellationToken);

        // 4. Delete the role
        var deleteResult = await _roleManagementService.DeleteRoleAsync(request.RoleId, cancellationToken);
        if (!deleteResult.Succeeded)
        {
            _logger.LogWarning(
                "Role deletion failed for role {RoleId}: {Errors}",
                request.RoleId, string.Join(", ", deleteResult.Errors));
            return DeleteRoleCommandResult.Failure(deleteResult.Errors);
        }

        // 5. Log audit entry
        var adminDisplayName = await _userIdentityService.GetUserDisplayNameAsync(
            request.AdminUserId, cancellationToken);

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "RoleDeleted",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = adminDisplayName ?? "System",
            TargetEntityType = "Role",
            TargetEntityId = request.RoleId,
            IpAddress = request.IpAddress,
            OldValues = System.Text.Json.JsonSerializer.Serialize(new { Name = roleName }),
            CorrelationId = request.CorrelationId,
            Details = $"Role '{roleName}' deleted."
        }, cancellationToken);

        _logger.LogInformation(
            "Role {RoleId} '{RoleName}' deleted by admin {AdminUserId}",
            request.RoleId, roleName, request.AdminUserId);

        return DeleteRoleCommandResult.Success();
    }
}
