using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.TransitionFeeStatus;

/// <summary>
/// Command to transition a planning fee to a new payment status.
/// Validates via the fee status state machine and enforces threshold rules:
/// fees above the configured threshold cannot go directly from Pending → Paid,
/// they must go through AwaitingApproval → Approved → Paid.
/// </summary>
public sealed record TransitionFeeStatusCommand : IRequest<FeeDto>
{
    public Guid FeeId { get; init; }
    public PaymentStatus NewStatus { get; init; }
}
