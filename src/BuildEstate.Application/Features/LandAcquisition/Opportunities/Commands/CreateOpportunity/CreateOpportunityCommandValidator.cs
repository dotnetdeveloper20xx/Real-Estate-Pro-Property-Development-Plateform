using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;

/// <summary>
/// Validates the CreateOpportunityCommand input fields.
/// </summary>
public sealed class CreateOpportunityCommandValidator : AbstractValidator<CreateOpportunityCommand>
{
    public CreateOpportunityCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name is required.")
            .MinimumLength(3)
            .WithMessage("Name must be at least 3 characters.")
            .MaximumLength(200)
            .WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Location)
            .NotEmpty()
            .WithMessage("Location is required.")
            .MinimumLength(3)
            .WithMessage("Location must be at least 3 characters.")
            .MaximumLength(500)
            .WithMessage("Location must not exceed 500 characters.");

        RuleFor(x => x.LandSize)
            .GreaterThan(0)
            .WithMessage("Land size must be greater than zero.");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("Description must not exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.County)
            .MaximumLength(100)
            .WithMessage("County must not exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.County));
    }
}
