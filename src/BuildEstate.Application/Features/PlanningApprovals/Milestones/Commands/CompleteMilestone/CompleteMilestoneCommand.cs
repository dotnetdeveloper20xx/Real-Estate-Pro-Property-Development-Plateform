using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CompleteMilestone;

/// <summary>
/// Command to mark a planning milestone as completed by recording the actual date.
/// Calculates variance in days between the actual and target dates.
/// </summary>
public sealed record CompleteMilestoneCommand : IRequest<MilestoneDto>
{
    public Guid MilestoneId { get; init; }
    public DateTime ActualDate { get; init; }
}
