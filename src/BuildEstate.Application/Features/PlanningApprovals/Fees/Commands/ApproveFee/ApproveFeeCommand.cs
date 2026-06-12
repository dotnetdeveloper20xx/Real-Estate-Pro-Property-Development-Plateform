using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.ApproveFee;

/// <summary>
/// Command to approve a planning fee that is awaiting Finance Director approval.
/// Restricted to the Finance_Director role at the controller level.
/// Records the approver identity, approval timestamp, and optional approval notes.
/// </summary>
public sealed record ApproveFeeCommand : IRequest<FeeDto>
{
    public Guid FeeId { get; init; }
    public string? ApprovalNotes { get; init; }
}
