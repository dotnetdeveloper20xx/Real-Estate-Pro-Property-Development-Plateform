using BuildEstate.Application.Interfaces;
using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRole;

/// <summary>
/// Validates the UpdateRoleCommand before the handler executes.
/// Checks:
/// - RoleId is non-empty
/// - Name is non-empty, alphanumeric + hyphens only, max 50 characters
/// - Name is unique (excluding the current role)
/// - Description is non-empty, max 200 characters
/// </summary>
public sealed class UpdateRoleCommandValidator : AbstractValidator<UpdateRoleCommand>
{
    private readonly IRoleManagementService _roleManagementService;

    public UpdateRoleCommandValidator(IRoleManagementService roleManagementService)
    {
        _roleManagementService = roleManagementService;

        ClassLevelCascadeMode = CascadeMode.Continue;

        RuleFor(x => x.RoleId)
            .NotEmpty()
            .WithMessage("Role ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Role name is required.")
            .MaximumLength(50)
            .WithMessage("Role name must not exceed 50 characters.")
            .Matches(@"^[a-zA-Z0-9\-]+$")
            .WithMessage("Role name must contain only alphanumeric characters and hyphens.")
            .MustAsync(BeUniqueNameForRole)
            .WithMessage("A role with this name already exists.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MaximumLength(200)
            .WithMessage("Description must not exceed 200 characters.");

        RuleFor(x => x.AdminUserId)
            .NotEmpty()
            .WithMessage("Admin user ID is required.");
    }

    private async Task<bool> BeUniqueNameForRole(UpdateRoleCommand command, string name, CancellationToken ct)
    {
        var exists = await _roleManagementService.RoleNameExistsExcludingAsync(name, command.RoleId, ct);
        return !exists;
    }
}
