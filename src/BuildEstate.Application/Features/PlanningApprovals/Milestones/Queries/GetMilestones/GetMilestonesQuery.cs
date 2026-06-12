using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Queries.GetMilestones;

/// <summary>
/// Query to retrieve all planning milestones for a given application,
/// ordered by TargetDate ascending. No pagination is needed since
/// milestones per application are limited to 8 maximum types.
/// </summary>
public sealed record GetMilestonesQuery : IRequest<List<MilestoneDto>>
{
    /// <summary>The planning application to retrieve milestones for.</summary>
    public Guid ApplicationId { get; init; }
}
