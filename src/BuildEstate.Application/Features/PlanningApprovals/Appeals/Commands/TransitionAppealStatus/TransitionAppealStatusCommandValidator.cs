using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.TransitionAppealStatus;

/// <summary>
/// Validates the TransitionAppealStatusCommand input.
/// AppealId must be non-empty; NewStatus must be a valid enum value.
/// When transitioning to Allowed or Dismissed: DecisionDate (past/present UTC) and DecisionSummary (20+ chars) are required.
/// When transitioning to Allowed: AppealOutcomeType is required.
/// </summary>
public sealed class TransitionAppealStatusCommandValidator : AbstractValidator<TransitionAppealStatusCommand>
{
    public TransitionAppealStatusCommandValidator()
    {
        RuleFor(x => x.AppealId)
            .NotEmpty()
            .WithMessage("AppealId is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid AppealStatus value.");

        // Decision data required when transitioning to Allowed or Dismissed
        RuleFor(x => x.DecisionDate)
            .NotNull()
            .WithMessage("DecisionDate is required when transitioning to Allowed or Dismissed.")
            .LessThanOrEqualTo(DateTime.UtcNow)
            .WithMessage("DecisionDate must be a past or present UTC date.")
            .When(x => x.NewStatus == AppealStatus.Allowed || x.NewStatus == AppealStatus.Dismissed);

        RuleFor(x => x.DecisionSummary)
            .NotEmpty()
            .WithMessage("DecisionSummary is required when transitioning to Allowed or Dismissed.")
            .MinimumLength(20)
            .WithMessage("DecisionSummary must be at least 20 characters.")
            .When(x => x.NewStatus == AppealStatus.Allowed || x.NewStatus == AppealStatus.Dismissed);

        // AppealOutcomeType required only when transitioning to Allowed
        RuleFor(x => x.AppealOutcomeType)
            .NotNull()
            .WithMessage("AppealOutcomeType is required when transitioning to Allowed.")
            .IsInEnum()
            .WithMessage("AppealOutcomeType must be a valid value.")
            .When(x => x.NewStatus == AppealStatus.Allowed);
    }
}
