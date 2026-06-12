using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.TransitionApplicationStatus;

/// <summary>
/// Command to transition a planning application to a new status.
/// Includes optional conditional data required for specific transitions:
/// - ApplicationReference: required when transitioning to Submitted
/// - DecisionDate: required when transitioning to Approved, ApprovedWithConditions, or Refused
/// - WithdrawalReason: required when transitioning to Withdrawn
/// </summary>
public sealed record TransitionApplicationStatusCommand : IRequest<ApplicationDto>
{
    public Guid ApplicationId { get; init; }
    public PlanningApplicationStatus NewStatus { get; init; }
    public string? ApplicationReference { get; init; }
    public DateTime? DecisionDate { get; init; }
    public string? WithdrawalReason { get; init; }
}
