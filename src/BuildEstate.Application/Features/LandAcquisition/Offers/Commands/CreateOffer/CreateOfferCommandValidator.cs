using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Commands.CreateOffer;

/// <summary>
/// Validates the CreateOfferCommand ensuring Amount is positive,
/// Currency matches ISO 4217 3-letter format, ValidUntil is a future date,
/// and OpportunityId is not empty.
/// </summary>
public sealed class CreateOfferCommandValidator : AbstractValidator<CreateOfferCommand>
{
    public CreateOfferCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be greater than zero.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .WithMessage("Currency is required.")
            .Matches(@"^[A-Z]{3}$")
            .WithMessage("Currency must be a valid ISO 4217 3-letter code (e.g., GBP, USD).");

        RuleFor(x => x.ValidUntil)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("ValidUntil must be a future date.");
    }
}
