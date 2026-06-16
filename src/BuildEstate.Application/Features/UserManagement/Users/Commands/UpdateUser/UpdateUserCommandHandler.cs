using System.Text.Json;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.UpdateUser;

/// <summary>
/// Handles user profile updates including name, email, and role changes.
/// 
/// Logic:
/// 1. Find user by ID — return failure if not found.
/// 2. Check email uniqueness (excluding the current user).
/// 3. Update profile fields (first name, last name, email).
/// 4. Detect role changes by comparing old roles to new roles.
/// 5. If roles changed: update roles, revoke all sessions/tokens, log audit with old/new roles.
/// 6. Log audit entry for the update operation.
/// </summary>
public sealed class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, UpdateUserResult>
{
    private readonly IIdentityService _identityService;
    private readonly ISessionService _sessionService;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<UpdateUserCommandHandler> _logger;

    public UpdateUserCommandHandler(
        IIdentityService identityService,
        ISessionService sessionService,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ILogger<UpdateUserCommandHandler> logger)
    {
        _identityService = identityService;
        _sessionService = sessionService;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<UpdateUserResult> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Find user
        var user = await _identityService.FindByIdAsync(request.UserId, cancellationToken);
        if (user is null)
        {
            _logger.LogWarning("Update user failed — user {UserId} not found", request.UserId);
            return UpdateUserResult.Failure("User not found.");
        }

        // 2. Check email uniqueness (excluding current user)
        if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var emailTaken = await _identityService.IsEmailTakenAsync(request.Email, request.UserId, cancellationToken);
            if (emailTaken)
            {
                _logger.LogWarning("Update user failed — email {Email} already in use", request.Email);
                return UpdateUserResult.Failure("Email address is already in use.");
            }
        }

        // 3. Update profile fields
        var profileUpdated = await _identityService.UpdateUserAsync(
            request.UserId, request.FirstName, request.LastName, request.Email, request.AdminUserId, cancellationToken);

        if (!profileUpdated)
        {
            _logger.LogError("Update user failed — could not update profile for user {UserId}", request.UserId);
            return UpdateUserResult.Failure("Failed to update user profile.");
        }

        // 4. Detect role changes
        var currentRoles = await _identityService.GetRolesAsync(request.UserId, cancellationToken);
        var oldRoleSet = new HashSet<string>(currentRoles, StringComparer.OrdinalIgnoreCase);
        var newRoleSet = new HashSet<string>(request.Roles, StringComparer.OrdinalIgnoreCase);
        var rolesChanged = !oldRoleSet.SetEquals(newRoleSet);

        // 5. If roles changed — update, revoke sessions, log
        if (rolesChanged)
        {
            var rolesUpdated = await _identityService.UpdateUserRolesAsync(request.UserId, request.Roles, cancellationToken);
            if (!rolesUpdated)
            {
                _logger.LogError("Update user failed — could not update roles for user {UserId}", request.UserId);
                return UpdateUserResult.Failure("Failed to update user roles.");
            }

            // Revoke all sessions and tokens for immediate enforcement
            await _sessionService.RevokeAllUserSessionsAsync(request.UserId, "Role assignment changed", cancellationToken);
            await _tokenService.RevokeAllUserTokensAsync(request.UserId, cancellationToken);

            _logger.LogInformation(
                "User {UserId} roles changed from [{OldRoles}] to [{NewRoles}] by admin {AdminUserId}. Sessions revoked.",
                request.UserId,
                string.Join(", ", currentRoles),
                string.Join(", ", request.Roles),
                request.AdminUserId);
        }

        // 6. Log audit entry
        var affectedFields = new List<string>();
        if (!string.Equals(user.FirstName, request.FirstName, StringComparison.Ordinal)) affectedFields.Add("FirstName");
        if (!string.Equals(user.LastName, request.LastName, StringComparison.Ordinal)) affectedFields.Add("LastName");
        if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase)) affectedFields.Add("Email");
        if (rolesChanged) affectedFields.Add("Roles");

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "UserUpdated",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = request.AdminUserId, // Caller should resolve admin name; keeping consistent with other handlers
            TargetEntityType = "User",
            TargetEntityId = request.UserId,
            TargetUserName = $"{user.FirstName} {user.LastName}",
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            OldValues = JsonSerializer.Serialize(new
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Roles = currentRoles
            }),
            NewValues = JsonSerializer.Serialize(new
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Roles = request.Roles
            }),
            AffectedFields = string.Join(", ", affectedFields),
            Details = rolesChanged
                ? "User profile and roles updated. All sessions revoked due to role change."
                : "User profile updated."
        }, cancellationToken);

        _logger.LogInformation("User {UserId} updated successfully by admin {AdminUserId}", request.UserId, request.AdminUserId);

        return UpdateUserResult.Success();
    }
}
