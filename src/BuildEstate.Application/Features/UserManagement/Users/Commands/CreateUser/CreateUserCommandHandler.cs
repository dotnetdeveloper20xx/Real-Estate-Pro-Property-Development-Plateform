using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.CreateUser;

/// <summary>
/// Handles user creation by:
/// 1. Creating the user via Identity (UserManager)
/// 2. Assigning the specified roles
/// 3. Recording the initial password hash in password history
/// 4. Logging an audit entry documenting the creation
///
/// Validation (email format, uniqueness, password policy, role existence) is handled
/// by the CreateUserCommandValidator via the MediatR pipeline behavior.
/// </summary>
public sealed class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, CreateUserResult>
{
    private readonly IUserIdentityService _userIdentityService;
    private readonly IPasswordHistoryService _passwordHistoryService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<CreateUserCommandHandler> _logger;

    public CreateUserCommandHandler(
        IUserIdentityService userIdentityService,
        IPasswordHistoryService passwordHistoryService,
        IAuditLogService auditLogService,
        ILogger<CreateUserCommandHandler> logger)
    {
        _userIdentityService = userIdentityService;
        _passwordHistoryService = passwordHistoryService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<CreateUserResult> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Create the user via Identity
        var createResult = await _userIdentityService.CreateUserAsync(
            request.FirstName,
            request.LastName,
            request.Email,
            request.Password,
            request.AdminUserId,
            cancellationToken);

        if (!createResult.Succeeded)
        {
            _logger.LogWarning(
                "User creation failed for email {Email}: {Errors}",
                request.Email, string.Join(", ", createResult.Errors));
            return CreateUserResult.Failure(createResult.Errors);
        }

        var userId = createResult.UserId!;

        // 2. Assign roles
        if (request.Roles.Count > 0)
        {
            var roleResult = await _userIdentityService.AssignRolesAsync(
                userId, request.Roles, cancellationToken);

            if (!roleResult.Succeeded)
            {
                _logger.LogWarning(
                    "Role assignment failed for user {UserId}: {Errors}",
                    userId, string.Join(", ", roleResult.Errors));
                return CreateUserResult.Failure(roleResult.Errors);
            }
        }

        // 3. Record initial password in history
        if (!string.IsNullOrEmpty(createResult.PasswordHash))
        {
            await _passwordHistoryService.RecordPasswordChangeAsync(
                userId, createResult.PasswordHash, cancellationToken);
        }

        // 4. Log audit entry
        var adminDisplayName = await _userIdentityService.GetUserDisplayNameAsync(
            request.AdminUserId, cancellationToken);

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "UserCreated",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = adminDisplayName ?? "System",
            TargetEntityType = "User",
            TargetEntityId = userId,
            TargetUserName = $"{request.FirstName} {request.LastName}",
            IpAddress = request.IpAddress,
            NewValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                request.FirstName,
                request.LastName,
                request.Email,
                Roles = request.Roles,
                IsActive = true
            }),
            AffectedFields = "FirstName,LastName,Email,Roles,IsActive",
            CorrelationId = request.CorrelationId,
            Details = $"User account created with roles: {string.Join(", ", request.Roles)}."
        }, cancellationToken);

        _logger.LogInformation(
            "User {UserId} created successfully by admin {AdminUserId} with roles [{Roles}]",
            userId, request.AdminUserId, string.Join(", ", request.Roles));

        return CreateUserResult.Success(userId);
    }
}
