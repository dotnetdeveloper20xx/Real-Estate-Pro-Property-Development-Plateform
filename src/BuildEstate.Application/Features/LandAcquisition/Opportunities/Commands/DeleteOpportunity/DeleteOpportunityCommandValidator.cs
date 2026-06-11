using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.DeleteOpportunity;

/// <summary>
/// Validates the DeleteOpportunityCommand input fields.
/// </summary>
public sealed class DeleteOpportunityCommandValidator : AbstractValidator<DeleteOpportunityCommand>
{
    public DeleteOpportunityCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Opportunity Id is required.");
    }
}
