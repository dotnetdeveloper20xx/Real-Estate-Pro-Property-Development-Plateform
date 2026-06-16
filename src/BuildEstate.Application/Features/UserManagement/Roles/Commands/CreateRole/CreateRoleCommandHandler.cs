using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.CreateRole;

/// <summary>
/// Handles role creation by:
/// 1. Creating the role via RoleManager (through IRoleManagementService)
/// 2. Assigning initial permissions if provided
/// 3. Logging an audit entry documenting the creation
///
/// Validation (name format, uniqueness, description length) is handled
/// by the CreateRoleCommandValidator via the MediatR pipeline behavior.
/// </summary>
public sealed class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, CreateRoleCommandResult>
{
    private readonly IRoleManagementService _roleManagementService;
    private readonly IUserIdentityService _userIdentityService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<CreateRoleCommandHandler> _logger;

    public CreateRoleCommandHandler(
        IRoleManagementService roleManagementService,
        IUserIdentityService userIdentityService,
        IAuditLogService auditLogService,
        ILogger<CreateRoleCommandHandler> logger)
    {
        _roleManagementService = roleManagementService;
        _userIdentityService = userIdentityService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<CreateRoleCommandResult> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        // 1. Create the role
        var createResult = await _roleManagementService.CreateRoleAsync(
            request.Name, request.Description, cancellationToken);

        if (!createResult.Succeeded)
        {
            _logger.LogWarning(
                "Role creation failed for name {RoleName}: {Errors}",
                request.Name, string.Join(", ", createResult.Errors));
            return CreateRoleCommandResult.Failure(createResult.Errors);
        }

        var roleId = createResult.RoleId!;

        // 2. Assign initial permissions if provided
        if (request.PermissionIds.Count > 0)
        {
            var permissionResult = await _roleManagementService.AssignPermissionsAsync(
                roleId, request.PermissionIds, cancellationToken);

            if (!permissionResult.Succeeded)
            {
                _logger.LogWarning(
                    "Permission assignment failed for role {RoleId}: {Errors}",
                    roleId, string.Join(", ", permissionResult.Errors));
                return CreateRoleCommandResult.Failure(permissionResult.Errors);
            }
        }

        // 3. Log audit entry
        var adminDisplayName = await _userIdentityService.GetUserDisplayNameAsync(
            request.AdminUserId, cancellationToken);

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "RoleCreated",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = adminDisplayName ?? "System",
            TargetEntityType = "Role",
            TargetEntityId = roleId,
            IpAddress = request.IpAddress,
            NewValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                request.Name,
                request.Description,
                PermissionCount = request.PermissionIds.Count
            }),
            AffectedFields = "Name,Description,Permissions",
            CorrelationId = request.CorrelationId,
            Details = $"Role '{request.Name}' created with {request.PermissionIds.Count} permission(s)."
        }, cancellationToken);

        _logger.LogInformation(
            "Role {RoleId} '{RoleName}' created successfully by admin {AdminUserId} with {PermissionCount} permission(s)",
            roleId, request.Name, request.AdminUserId, request.PermissionIds.Count);

        return CreateRoleCommandResult.Success(roleId);
    }
}
