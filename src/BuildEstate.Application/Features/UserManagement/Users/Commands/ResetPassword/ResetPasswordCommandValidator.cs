using BuildEstate.Application.Features.UserManagement.Validators;
using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.ResetPassword;

/// <summary>
/// Validates the ResetPasswordCommand input fields.
/// Uses the reusable PasswordValidator for the new password policy enforcement.
/// Returns all violated rules (not just the first).
/// </summary>
public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");

        RuleFor(x => x.AdminUserId)
            .NotEmpty()
            .WithMessage("Admin User ID is required.");

        RuleFor(x => x.AdminUserName)
            .NotEmpty()
            .WithMessage("Admin User Name is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage("New password is required.");

        RuleFor(x => x.NewPassword)
            .SetValidator(new PasswordValidator())
            .When(x => !string.IsNullOrEmpty(x.NewPassword));
    }
}
