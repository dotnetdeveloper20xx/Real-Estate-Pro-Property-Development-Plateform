using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplicationById;

/// <summary>
/// Query to retrieve a single planning application by its unique identifier,
/// including all related entities (conditions, documents, fees, milestones,
/// council contact) and a linked LandOpportunity summary.
/// </summary>
public sealed record GetApplicationByIdQuery : IRequest<ApplicationDetailDto>
{
    /// <summary>The unique identifier of the planning application to retrieve.</summary>
    public Guid ApplicationId { get; init; }
}
