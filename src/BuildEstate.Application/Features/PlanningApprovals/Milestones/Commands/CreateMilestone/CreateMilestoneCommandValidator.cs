using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CreateMilestone;

/// <summary>
/// Validates the CreateMilestoneCommand input fields.
/// </summary>
public sealed class CreateMilestoneCommandValidator : AbstractValidator<CreateMilestoneCommand>
{
    public CreateMilestoneCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty()
            .WithMessage("ApplicationId is required.");

        RuleFor(x => x.MilestoneType)
            .IsInEnum()
            .WithMessage("MilestoneType must be a valid milestone type.");

        RuleFor(x => x.TargetDate)
            .NotEmpty()
            .WithMessage("TargetDate is required.")
            .Must(date => date != DateTime.MinValue)
            .WithMessage("TargetDate must be a valid date.");
    }
}
