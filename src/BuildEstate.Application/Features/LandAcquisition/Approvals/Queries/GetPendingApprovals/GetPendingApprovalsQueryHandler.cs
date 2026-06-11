using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Queries.GetPendingApprovals;

/// <summary>
/// Handles retrieval of all approval requests with Pending status.
/// Uses AsNoTracking for optimised read-only queries.
/// </summary>
public sealed class GetPendingApprovalsQueryHandler
    : IRequestHandler<GetPendingApprovalsQuery, List<ApprovalRequestDto>>
{
    private readonly IRepository<ApprovalRequest> _approvalRepository;
    private readonly IMapper _mapper;

    public GetPendingApprovalsQueryHandler(
        IRepository<ApprovalRequest> approvalRepository,
        IMapper mapper)
    {
        _approvalRepository = approvalRepository;
        _mapper = mapper;
    }

    public async Task<List<ApprovalRequestDto>> Handle(
        GetPendingApprovalsQuery request,
        CancellationToken cancellationToken)
    {
        var pendingApprovals = await _approvalRepository
            .Query()
            .AsNoTracking()
            .Where(ar => ar.Status == ApprovalStatus.Pending)
            .OrderByDescending(ar => ar.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ApprovalRequestDto>>(pendingApprovals);
    }
}
