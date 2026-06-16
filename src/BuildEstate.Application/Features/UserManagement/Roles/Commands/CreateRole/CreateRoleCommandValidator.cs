using BuildEstate.Application.Interfaces;
using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.CreateRole;

/// <summary>
/// Validates the CreateRoleCommand before the handler executes.
/// Checks:
/// - Name is non-empty, alphanumeric + hyphens only, max 50 characters
/// - Name is unique (async check against RoleManager)
/// - Description is non-empty, max 200 characters
/// - All specified permission IDs exist in the system
/// </summary>
public sealed class CreateRoleCommandValidator : AbstractValidator<CreateRoleCommand>
{
    private readonly IRoleManagementService _roleManagementService;

    public CreateRoleCommandValidator(IRoleManagementService roleManagementService)
    {
        _roleManagementService = roleManagementService;

        ClassLevelCascadeMode = CascadeMode.Continue;

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Role name is required.")
            .MaximumLength(50)
            .WithMessage("Role name must not exceed 50 characters.")
            .Matches(@"^[a-zA-Z0-9\-]+$")
            .WithMessage("Role name must contain only alphanumeric characters and hyphens.")
            .MustAsync(BeUniqueName)
            .WithMessage("A role with this name already exists.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MaximumLength(200)
            .WithMessage("Description must not exceed 200 characters.");

        RuleFor(x => x.PermissionIds)
            .NotNull()
            .WithMessage("Permission IDs list cannot be null.");

        RuleFor(x => x.AdminUserId)
            .NotEmpty()
            .WithMessage("Admin user ID is required.");
    }

    private async Task<bool> BeUniqueName(string name, CancellationToken ct)
    {
        var exists = await _roleManagementService.RoleNameExistsAsync(name, ct);
        return !exists;
    }
}
