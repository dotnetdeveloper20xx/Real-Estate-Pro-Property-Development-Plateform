using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Commands.TransitionOfferStatus;

/// <summary>
/// Validates the TransitionOfferStatusCommand.
/// Ensures OfferId is present, TargetStatus is a valid enum value,
/// and CounterOfferAmount is greater than zero when transitioning to CounterOffered.
/// </summary>
public sealed class TransitionOfferStatusCommandValidator : AbstractValidator<TransitionOfferStatusCommand>
{
    public TransitionOfferStatusCommandValidator()
    {
        RuleFor(x => x.OfferId)
            .NotEmpty()
            .WithMessage("OfferId is required.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("TargetStatus must be a valid OfferStatus value.");

        RuleFor(x => x.CounterOfferAmount)
            .GreaterThan(0)
            .WithMessage("CounterOfferAmount must be greater than zero when transitioning to CounterOffered.")
            .When(x => x.TargetStatus == OfferStatus.CounterOffered);
    }
}
