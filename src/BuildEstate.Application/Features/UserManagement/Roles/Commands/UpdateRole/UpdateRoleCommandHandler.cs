using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRole;

/// <summary>
/// Handles role updates by:
/// 1. Verifying the role is not built-in (if name is being changed)
/// 2. Updating the role via IRoleManagementService
/// 3. Logging an audit entry documenting the update
/// </summary>
public sealed class UpdateRoleCommandHandler : IRequestHandler<UpdateRoleCommand, UpdateRoleCommandResult>
{
    private readonly IRoleManagementService _roleManagementService;
    private readonly IUserIdentityService _userIdentityService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<UpdateRoleCommandHandler> _logger;

    public UpdateRoleCommandHandler(
        IRoleManagementService roleManagementService,
        IUserIdentityService userIdentityService,
        IAuditLogService auditLogService,
        ILogger<UpdateRoleCommandHandler> logger)
    {
        _roleManagementService = roleManagementService;
        _userIdentityService = userIdentityService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<UpdateRoleCommandResult> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if role is built-in
        var isBuiltIn = await _roleManagementService.IsBuiltInRoleAsync(request.RoleId, cancellationToken);
        if (isBuiltIn)
        {
            // Check if name is being changed
            var currentName = await _roleManagementService.GetRoleNameAsync(request.RoleId, cancellationToken);
            if (currentName != null && !string.Equals(currentName, request.Name, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Attempt to rename built-in role {RoleId} from '{CurrentName}' to '{NewName}' by admin {AdminUserId}",
                    request.RoleId, currentName, request.Name, request.AdminUserId);
                return UpdateRoleCommandResult.Failure("Built-in roles cannot be renamed.");
            }
        }

        // 2. Update the role
        var updateResult = await _roleManagementService.UpdateRoleAsync(
            request.RoleId, request.Name, request.Description, cancellationToken);

        if (!updateResult.Succeeded)
        {
            _logger.LogWarning(
                "Role update failed for role {RoleId}: {Errors}",
                request.RoleId, string.Join(", ", updateResult.Errors));
            return UpdateRoleCommandResult.Failure(updateResult.Errors);
        }

        // 3. Log audit entry
        var adminDisplayName = await _userIdentityService.GetUserDisplayNameAsync(
            request.AdminUserId, cancellationToken);

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "RoleUpdated",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = adminDisplayName ?? "System",
            TargetEntityType = "Role",
            TargetEntityId = request.RoleId,
            IpAddress = request.IpAddress,
            NewValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                request.Name,
                request.Description
            }),
            AffectedFields = "Name,Description",
            CorrelationId = request.CorrelationId,
            Details = $"Role '{request.Name}' updated."
        }, cancellationToken);

        _logger.LogInformation(
            "Role {RoleId} updated to name '{RoleName}' by admin {AdminUserId}",
            request.RoleId, request.Name, request.AdminUserId);

        return UpdateRoleCommandResult.Success();
    }
}
