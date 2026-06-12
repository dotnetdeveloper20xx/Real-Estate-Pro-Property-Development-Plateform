using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.TransitionApplicationStatus;

/// <summary>
/// Validates basic field presence for the TransitionApplicationStatusCommand.
/// Business rules (state machine, conditional data) are enforced in the handler.
/// </summary>
public sealed class TransitionApplicationStatusCommandValidator : AbstractValidator<TransitionApplicationStatusCommand>
{
    public TransitionApplicationStatusCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty()
            .WithMessage("ApplicationId is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid PlanningApplicationStatus value.");

        // Conditional validation: ApplicationReference required for Submitted
        When(x => x.NewStatus == PlanningApplicationStatus.Submitted, () =>
        {
            RuleFor(x => x.ApplicationReference)
                .NotEmpty()
                .WithMessage("ApplicationReference is required when transitioning to Submitted.")
                .MinimumLength(5)
                .WithMessage("ApplicationReference must be at least 5 characters.")
                .MaximumLength(50)
                .WithMessage("ApplicationReference must not exceed 50 characters.");
        });

        // Conditional validation: DecisionDate required for Approved/ApprovedWithConditions/Refused
        When(x => x.NewStatus == PlanningApplicationStatus.Approved
                || x.NewStatus == PlanningApplicationStatus.ApprovedWithConditions
                || x.NewStatus == PlanningApplicationStatus.Refused, () =>
        {
            RuleFor(x => x.DecisionDate)
                .NotNull()
                .WithMessage("DecisionDate is required when transitioning to Approved, ApprovedWithConditions, or Refused.")
                .LessThanOrEqualTo(DateTime.UtcNow)
                .When(x => x.DecisionDate.HasValue)
                .WithMessage("DecisionDate must not be in the future.");
        });

        // Conditional validation: WithdrawalReason required for Withdrawn
        When(x => x.NewStatus == PlanningApplicationStatus.Withdrawn, () =>
        {
            RuleFor(x => x.WithdrawalReason)
                .NotEmpty()
                .WithMessage("WithdrawalReason is required when transitioning to Withdrawn.")
                .MinimumLength(10)
                .WithMessage("WithdrawalReason must be at least 10 characters.");
        });
    }
}
