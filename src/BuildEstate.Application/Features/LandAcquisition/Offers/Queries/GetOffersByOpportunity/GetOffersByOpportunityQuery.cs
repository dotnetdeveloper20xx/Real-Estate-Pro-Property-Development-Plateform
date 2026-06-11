using BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Queries.GetOffersByOpportunity;

/// <summary>
/// Query to retrieve all offers for a specific opportunity, ordered by OfferDate descending.
/// </summary>
public sealed record GetOffersByOpportunityQuery : IRequest<List<OfferDto>>
{
    public Guid OpportunityId { get; init; }
}
