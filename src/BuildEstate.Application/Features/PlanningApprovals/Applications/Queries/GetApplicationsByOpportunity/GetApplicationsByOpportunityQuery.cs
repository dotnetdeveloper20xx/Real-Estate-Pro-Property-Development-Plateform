using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplicationsByOpportunity;

/// <summary>
/// Query to retrieve all planning applications linked to a given land opportunity.
/// Returns a list of summary DTOs for Land Acquisition module integration.
/// No pagination is applied since one opportunity typically has very few applications.
/// </summary>
public sealed record GetApplicationsByOpportunityQuery : IRequest<List<ApplicationSummaryDto>>
{
    /// <summary>
    /// The unique identifier of the LandOpportunity to retrieve applications for.
    /// </summary>
    public Guid OpportunityId { get; init; }
}
