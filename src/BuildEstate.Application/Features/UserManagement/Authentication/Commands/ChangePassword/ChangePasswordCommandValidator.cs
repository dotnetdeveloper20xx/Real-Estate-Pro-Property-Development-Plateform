using BuildEstate.Application.Features.UserManagement.Validators;
using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.ChangePassword;

/// <summary>
/// Validates the ChangePasswordCommand input fields.
/// Reuses the shared PasswordValidator for password policy enforcement.
/// Enforces: min 8 chars, max 128 chars, 1 uppercase, 1 number, 1 special character.
/// Returns all violated rules (not just the first).
/// </summary>
public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");

        RuleFor(x => x.CurrentPassword)
            .NotEmpty()
            .WithMessage("Current password is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage("New password is required.");

        RuleFor(x => x.NewPassword)
            .SetValidator(new PasswordValidator())
            .When(x => !string.IsNullOrEmpty(x.NewPassword));

        RuleFor(x => x.NewPassword)
            .NotEqual(x => x.CurrentPassword)
            .WithMessage("New password must be different from the current password.")
            .When(x => !string.IsNullOrEmpty(x.NewPassword) && !string.IsNullOrEmpty(x.CurrentPassword));
    }
}
