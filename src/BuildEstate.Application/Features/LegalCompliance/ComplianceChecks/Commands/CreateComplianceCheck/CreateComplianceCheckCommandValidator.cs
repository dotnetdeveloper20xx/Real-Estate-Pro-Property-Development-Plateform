using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Commands.CreateComplianceCheck;

/// <summary>
/// Validates the CreateComplianceCheckCommand input fields.
/// Enforces ComplianceRequirementId presence, CheckDate ≤ now, valid Outcome enum,
/// Findings length 10-3000, and conditional remediation rules for NonCompliant outcomes.
/// </summary>
public sealed class CreateComplianceCheckCommandValidator : AbstractValidator<CreateComplianceCheckCommand>
{
    public CreateComplianceCheckCommandValidator()
    {
        RuleFor(x => x.ComplianceRequirementId)
            .NotEmpty()
            .WithMessage("ComplianceRequirementId is required.");

        RuleFor(x => x.CheckDate)
            .NotEmpty()
            .WithMessage("CheckDate is required.")
            .LessThanOrEqualTo(DateTime.UtcNow)
            .WithMessage("CheckDate must not be in the future.");

        RuleFor(x => x.Outcome)
            .IsInEnum()
            .WithMessage("Outcome must be a valid ComplianceCheckOutcome value.");

        RuleFor(x => x.Findings)
            .NotEmpty()
            .WithMessage("Findings are required.")
            .MinimumLength(10)
            .WithMessage("Findings must be at least 10 characters.")
            .MaximumLength(3000)
            .WithMessage("Findings must not exceed 3000 characters.");

        When(x => x.Outcome == ComplianceCheckOutcome.NonCompliant, () =>
        {
            RuleFor(x => x.RemediationPlan)
                .NotEmpty()
                .WithMessage("RemediationPlan is required when outcome is Non-Compliant.")
                .MinimumLength(20)
                .WithMessage("RemediationPlan must be at least 20 characters.");

            RuleFor(x => x.RemediationDueDate)
                .NotEmpty()
                .WithMessage("RemediationDueDate is required when outcome is Non-Compliant.")
                .GreaterThan(DateTime.UtcNow)
                .WithMessage("RemediationDueDate must be in the future.");
        });
    }
}
