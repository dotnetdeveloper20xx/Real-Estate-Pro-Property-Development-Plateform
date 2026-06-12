using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CompleteMilestone;

/// <summary>
/// Validates the CompleteMilestoneCommand input fields.
/// Ensures MilestoneId is not empty and ActualDate is a valid non-default date.
/// </summary>
public sealed class CompleteMilestoneCommandValidator : AbstractValidator<CompleteMilestoneCommand>
{
    public CompleteMilestoneCommandValidator()
    {
        RuleFor(x => x.MilestoneId)
            .NotEmpty()
            .WithMessage("MilestoneId is required.");

        RuleFor(x => x.ActualDate)
            .NotEmpty()
            .WithMessage("ActualDate is required.")
            .Must(date => date != default)
            .WithMessage("ActualDate must be a valid date.");
    }
}
