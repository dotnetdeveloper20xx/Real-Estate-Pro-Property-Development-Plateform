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
    }
}
