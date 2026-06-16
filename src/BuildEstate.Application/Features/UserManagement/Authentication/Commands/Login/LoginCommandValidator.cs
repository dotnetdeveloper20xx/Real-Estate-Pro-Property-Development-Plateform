using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.Login;

/// <summary>
/// Validates the LoginCommand input before the handler executes.
/// Ensures email format is valid and password is non-empty.
/// Business validation (user exists, lockout, etc.) happens in the handler.
/// </summary>
public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("A valid email address is required.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password is required.");
    }
}
