using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.TransitionLegalCaseStatus;

/// <summary>
/// Validates the TransitionLegalCaseStatusCommand input.
/// Enforces status-specific field requirements:
/// - Resolved: ResolutionSummary (≥20 chars) + ResolutionDate (≤ UTC now)
/// - Escalated: EscalationReason (≥10 chars)
/// - OnHold: HoldReason (≥10 chars)
/// </summary>
public sealed class TransitionLegalCaseStatusCommandValidator
    : AbstractValidator<TransitionLegalCaseStatusCommand>
{
    public TransitionLegalCaseStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid LegalCaseStatus value.");

        // WHEN NewStatus = Resolved
        When(x => x.NewStatus == LegalCaseStatus.Resolved, () =>
        {
            RuleFor(x => x.ResolutionSummary)
                .NotEmpty()
                .WithMessage("ResolutionSummary is required when transitioning to Resolved.")
                .MinimumLength(20)
                .WithMessage("ResolutionSummary must be at least 20 characters.");

            RuleFor(x => x.ResolutionDate)
                .NotEmpty()
                .WithMessage("ResolutionDate is required when transitioning to Resolved.")
                .LessThanOrEqualTo(DateTime.UtcNow)
                .WithMessage("ResolutionDate must not be in the future.");
        });

        // WHEN NewStatus = Escalated
        When(x => x.NewStatus == LegalCaseStatus.Escalated, () =>
        {
            RuleFor(x => x.EscalationReason)
                .NotEmpty()
                .WithMessage("EscalationReason is required when transitioning to Escalated.")
                .MinimumLength(10)
                .WithMessage("EscalationReason must be at least 10 characters.");
        });

        // WHEN NewStatus = OnHold
        When(x => x.NewStatus == LegalCaseStatus.OnHold, () =>
        {
            RuleFor(x => x.HoldReason)
                .NotEmpty()
                .WithMessage("HoldReason is required when transitioning to OnHold.")
                .MinimumLength(10)
                .WithMessage("HoldReason must be at least 10 characters.");
        });
    }
}
