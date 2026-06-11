using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Queries.GetPendingApprovals;

/// <summary>
/// Query to retrieve all approval requests with Pending status.
/// Used by the Finance Director to view outstanding approval items.
/// </summary>
public sealed record GetPendingApprovalsQuery : IRequest<List<ApprovalRequestDto>>;
