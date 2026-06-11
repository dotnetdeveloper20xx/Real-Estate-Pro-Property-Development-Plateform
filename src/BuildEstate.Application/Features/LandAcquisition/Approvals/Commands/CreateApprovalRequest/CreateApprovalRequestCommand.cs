using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.CreateApprovalRequest;

/// <summary>
/// Command to create an approval request. Auto-triggered when an offer exceeds
/// the configurable threshold. Sets Status to Pending and notifies the Finance Director.
/// </summary>
public sealed record CreateApprovalRequestCommand : IRequest<ApprovalRequestDto>
{
    public Guid OpportunityId { get; init; }
    public decimal RequestedAmount { get; init; }
}
