using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.ApproveOrReject;

/// <summary>
/// Command to approve or reject an existing approval request.
/// Records the approver, timestamp, and notes or rejection reason.
/// Notifies the Acquisition Manager on rejection.
/// </summary>
public sealed record ApproveOrRejectCommand : IRequest<ApprovalRequestDto>
{
    public Guid ApprovalRequestId { get; init; }
    public bool IsApproved { get; init; }
    public string? Notes { get; init; }
    public string? RejectionReason { get; init; }
}
