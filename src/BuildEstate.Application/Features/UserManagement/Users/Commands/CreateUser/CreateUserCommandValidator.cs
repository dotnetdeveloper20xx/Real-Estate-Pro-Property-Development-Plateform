using BuildEstate.Application.Features.UserManagement.Validators;
using BuildEstate.Application.Interfaces;
using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.CreateUser;

/// <summary>
/// Validates the CreateUserCommand before the handler executes.
/// Checks:
/// - FirstName and LastName are non-empty and within length limits
/// - Email format is valid
/// - Email is unique (async check against Identity store)
/// - Password satisfies the password policy (via reusable PasswordValidator)
/// - All specified roles exist in the system
/// </summary>
public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    private readonly IUserIdentityService _userIdentityService;

    public CreateUserCommandValidator(IUserIdentityService userIdentityService)
    {
        _userIdentityService = userIdentityService;

        ClassLevelCascadeMode = CascadeMode.Continue;

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required.")
            .MaximumLength(100)
            .WithMessage("First name must not exceed 100 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required.")
            .MaximumLength(100)
            .WithMessage("Last name must not exceed 100 characters.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("A valid email address is required.")
            .MustAsync(BeUniqueEmail)
            .WithMessage("This email address is already in use.");

        RuleFor(x => x.Password)
            .SetValidator(new PasswordValidator());

        RuleFor(x => x.Roles)
            .NotNull()
            .WithMessage("Roles list cannot be null.");

        RuleForEach(x => x.Roles)
            .MustAsync(BeExistingRole)
            .WithMessage((_, role) => $"Role '{role}' does not exist.");

        RuleFor(x => x.AdminUserId)
            .NotEmpty()
            .WithMessage("Admin user ID is required.");
    }

    private async Task<bool> BeUniqueEmail(string email, CancellationToken ct)
    {
        var exists = await _userIdentityService.EmailExistsAsync(email, ct);
        return !exists;
    }

    private async Task<bool> BeExistingRole(string roleName, CancellationToken ct)
    {
        return await _userIdentityService.RoleExistsAsync(roleName, ct);
    }
}
