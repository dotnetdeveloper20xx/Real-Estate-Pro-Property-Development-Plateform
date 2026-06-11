using BuildEstate.Application.Features.LandAcquisition.Feasibility.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Feasibility.Queries.GetFeasibilityByOpportunity;

/// <summary>
/// Query to retrieve the feasibility assessment for a specific opportunity.
/// Returns null if no assessment exists for the given OpportunityId.
/// </summary>
public sealed record GetFeasibilityByOpportunityQuery : IRequest<FeasibilityAssessmentDto?>
{
    public Guid OpportunityId { get; init; }
}
