using BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Commands.CreateOffer;

/// <summary>
/// Command to create a new offer for a land opportunity.
/// Sets OfferDate to UTC now and Status to UnderReview.
/// </summary>
public sealed record CreateOfferCommand : IRequest<OfferDto>
{
    public Guid OpportunityId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = string.Empty;
    public DateTime ValidUntil { get; init; }
}
