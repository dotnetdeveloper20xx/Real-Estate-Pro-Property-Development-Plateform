using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.CreateDueDiligence;

/// <summary>
/// Validates the CreateDueDiligenceCommand input fields.
/// Ensures OpportunityId is provided and Type is a valid DueDiligenceType enum value.
/// </summary>
public sealed class CreateDueDiligenceCommandValidator : AbstractValidator<CreateDueDiligenceCommand>
{
    public CreateDueDiligenceCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Type must be a valid DueDiligenceType value (Legal, Environmental, Planning, Utilities, or Valuation).");
    }
}
