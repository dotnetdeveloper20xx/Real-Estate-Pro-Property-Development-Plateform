using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRolePermissions;

/// <summary>
/// Validates the UpdateRolePermissionsCommand before the handler executes.
/// Checks:
/// - RoleId is non-empty
/// - PermissionId is non-empty
/// - AdminUserId is non-empty
/// </summary>
public sealed class UpdateRolePermissionsCommandValidator : AbstractValidator<UpdateRolePermissionsCommand>
{
    public UpdateRolePermissionsCommandValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty()
            .WithMessage("Role ID is required.");

        RuleFor(x => x.PermissionId)
            .NotEmpty()
            .WithMessage("Permission ID is required.");

        RuleFor(x => x.AdminUserId)
            .NotEmpty()
            .WithMessage("Admin user ID is required.");
    }
}
