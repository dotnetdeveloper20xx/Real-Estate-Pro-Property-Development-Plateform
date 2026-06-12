using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CheckOverdueMilestones;

/// <summary>
/// Command to check all pending milestones whose TargetDate has been exceeded
/// and mark them as Overdue. Returns the count of milestones newly marked overdue.
/// Intended to be invoked periodically (e.g. via scheduled job or background service).
/// </summary>
public sealed record CheckOverdueMilestonesCommand : IRequest<int>;
