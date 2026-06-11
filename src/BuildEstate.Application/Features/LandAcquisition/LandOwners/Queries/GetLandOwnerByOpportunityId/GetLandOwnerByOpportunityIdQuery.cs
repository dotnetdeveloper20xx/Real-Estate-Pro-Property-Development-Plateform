using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Queries.GetLandOwnerByOpportunityId;

/// <summary>
/// Query to retrieve the land owner associated with a specific opportunity.
/// </summary>
public sealed record GetLandOwnerByOpportunityIdQuery : IRequest<LandOwnerDto?>
{
    public Guid OpportunityId { get; init; }
}
