using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.TransitionAppealStatus;

/// <summary>
/// Command to transition a planning appeal to a new status.
/// Enforces appeal state machine rules, decision data requirements for Allowed/Dismissed,
/// and raises AppealAllowedDomainEvent when transitioning to Allowed.
/// </summary>
public sealed record TransitionAppealStatusCommand : IRequest<AppealDto>
{
    public Guid AppealId { get; init; }
    public AppealStatus NewStatus { get; init; }
    public DateTime? DecisionDate { get; init; }
    public string? DecisionSummary { get; init; }
    public AppealOutcomeType? AppealOutcomeType { get; init; }
}
