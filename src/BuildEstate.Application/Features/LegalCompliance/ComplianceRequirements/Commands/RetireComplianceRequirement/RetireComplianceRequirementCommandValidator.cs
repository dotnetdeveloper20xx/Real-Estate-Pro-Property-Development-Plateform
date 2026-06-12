using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.RetireComplianceRequirement;

/// <summary>
/// Validates the RetireComplianceRequirementCommand input fields.
/// Ensures Id is provided, NewStatus is Superseded or Retired, and RetirementReason is at least 10 characters.
/// </summary>
public sealed class RetireComplianceRequirementCommandValidator : AbstractValidator<RetireComplianceRequirementCommand>
{
    public RetireComplianceRequirementCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Compliance requirement Id is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid compliance requirement status.")
            .Must(status => status == ComplianceRequirementStatus.Superseded || status == ComplianceRequirementStatus.Retired)
            .WithMessage("NewStatus must be either Superseded or Retired.");

        RuleFor(x => x.RetirementReason)
            .NotEmpty()
            .WithMessage("RetirementReason is required.")
            .MinimumLength(10)
            .WithMessage("RetirementReason must be at least 10 characters.");
    }
}
