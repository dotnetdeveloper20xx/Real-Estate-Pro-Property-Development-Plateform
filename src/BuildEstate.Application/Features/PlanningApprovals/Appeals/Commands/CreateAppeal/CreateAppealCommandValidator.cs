using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.CreateAppeal;

/// <summary>
/// Validates the CreateAppealCommand input fields.
/// </summary>
public sealed class CreateAppealCommandValidator : AbstractValidator<CreateAppealCommand>
{
    public CreateAppealCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty()
            .WithMessage("Application ID is required.");

        RuleFor(x => x.AppealGrounds)
            .NotEmpty()
            .WithMessage("Appeal grounds are required.")
            .MinimumLength(50)
            .WithMessage("Appeal grounds must be at least 50 characters.")
            .MaximumLength(5000)
            .WithMessage("Appeal grounds must not exceed 5000 characters.");

        RuleFor(x => x.AppealType)
            .IsInEnum()
            .WithMessage("Appeal type must be a valid value (WrittenRepresentations, Hearing, or PublicInquiry).");
    }
}
