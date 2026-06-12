using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.CreateCondition;

/// <summary>
/// Validates the CreateConditionCommand input fields.
/// </summary>
public sealed class CreateConditionCommandValidator : AbstractValidator<CreateConditionCommand>
{
    public CreateConditionCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty()
            .WithMessage("ApplicationId is required.");

        RuleFor(x => x.ConditionNumber)
            .GreaterThan(0)
            .WithMessage("ConditionNumber must be a positive integer.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MinimumLength(10)
            .WithMessage("Description must be at least 10 characters.")
            .MaximumLength(1000)
            .WithMessage("Description must not exceed 1000 characters.");

        RuleFor(x => x.ConditionType)
            .IsInEnum()
            .WithMessage("ConditionType must be a valid condition type.");
    }
}
