using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.TransitionConditionStatus;

/// <summary>
/// Command to transition a planning condition to a new status.
/// Enforces condition state machine rules and discharge data requirements.
/// </summary>
public sealed record TransitionConditionStatusCommand : IRequest<ConditionDto>
{
    public Guid ConditionId { get; init; }
    public ConditionStatus NewStatus { get; init; }
    public DateTime? DischargeDate { get; init; }
    public string? DischargeReference { get; init; }
}
