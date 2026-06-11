using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.UpdateOpportunity;

/// <summary>
/// Validates the UpdateOpportunityCommand input fields.
/// Same validation rules as create: Name 3-200, Location 3-500, LandSize > 0, Id not empty.
/// </summary>
public sealed class UpdateOpportunityCommandValidator : AbstractValidator<UpdateOpportunityCommand>
{
    public UpdateOpportunityCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Opportunity Id is required.");

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
            .WithMessage("Land size must be a positive value.");
    }
}
