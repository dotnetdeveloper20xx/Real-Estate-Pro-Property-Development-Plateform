using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CreateMilestone;

/// <summary>
/// Command to create a new planning milestone for a given application.
/// </summary>
public sealed record CreateMilestoneCommand : IRequest<MilestoneDto>
{
    public Guid ApplicationId { get; init; }
    public MilestoneType MilestoneType { get; init; }
    public DateTime TargetDate { get; init; }
}
