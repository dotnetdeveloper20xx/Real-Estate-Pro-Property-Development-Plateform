using BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Commands.TransitionOfferStatus;

/// <summary>
/// Command to transition an offer to a new status using the offer state machine.
/// When target status is CounterOffered, CounterOfferAmount and OriginalOfferId must be provided.
/// When target status is Accepted and opportunity is in OfferMade status,
/// the opportunity is auto-transitioned to UnderContract.
/// </summary>
public sealed record TransitionOfferStatusCommand : IRequest<OfferDto>
{
    public Guid OfferId { get; init; }
    public OfferStatus TargetStatus { get; init; }
    public decimal? CounterOfferAmount { get; init; }
    public Guid? OriginalOfferId { get; init; }
}
