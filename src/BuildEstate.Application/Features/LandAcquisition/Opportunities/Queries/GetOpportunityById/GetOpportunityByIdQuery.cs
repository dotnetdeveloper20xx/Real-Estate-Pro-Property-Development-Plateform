using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunityById;

/// <summary>
/// Query to retrieve a single opportunity by its unique identifier,
/// including all related navigation data for the detail view.
/// </summary>
public sealed record GetOpportunityByIdQuery : IRequest<OpportunityDetailDto?>
{
    public Guid Id { get; init; }
}
