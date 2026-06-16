using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Validators;

/// <summary>
/// Reusable password policy validator that enforces all password complexity rules.
/// Validates a raw password string against the BuildEstate Pro password policy.
/// 
/// Rules enforced:
/// 1. Not empty
/// 2. Minimum 8 characters
/// 3. Maximum 128 characters
/// 4. At least 1 uppercase letter [A-Z]
/// 5. At least 1 numeric digit [0-9]
/// 6. At least 1 special character from: !@#$%^&amp;*()-_+=[]{}|;:',.<>?/`~
///
/// All rules are evaluated independently (CascadeMode.Continue) so ALL violated rules
/// are returned in a single validation pass, not just the first failure.
///
/// Usage:
///   RuleFor(x => x.Password).SetValidator(new PasswordValidator());
/// </summary>
public sealed class PasswordValidator : AbstractValidator<string>
{
    public PasswordValidator()
    {
        ClassLevelCascadeMode = CascadeMode.Continue;
        RuleLevelCascadeMode = CascadeMode.Continue;

        RuleFor(p => p)
            .NotEmpty()
            .WithMessage("Password is required.");

        RuleFor(p => p)
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters.")
            .When(p => !string.IsNullOrEmpty(p));

        RuleFor(p => p)
            .MaximumLength(128)
            .WithMessage("Password must not exceed 128 characters.")
            .When(p => !string.IsNullOrEmpty(p));

        RuleFor(p => p)
            .Matches("[A-Z]")
            .WithMessage("Password must contain at least 1 uppercase letter.")
            .When(p => !string.IsNullOrEmpty(p));

        RuleFor(p => p)
            .Matches("[0-9]")
            .WithMessage("Password must contain at least 1 number.")
            .When(p => !string.IsNullOrEmpty(p));

        RuleFor(p => p)
            .Matches(@"[!@#$%^&*()\-_+=\[\]{}|;:',.<>?/`~]")
            .WithMessage("Password must contain at least 1 special character.")
            .When(p => !string.IsNullOrEmpty(p));
    }
}
