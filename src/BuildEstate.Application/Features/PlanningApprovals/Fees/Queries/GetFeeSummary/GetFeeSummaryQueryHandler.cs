using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Queries.GetFeeSummary;

/// <summary>
/// Handles retrieval of fee totals for a given planning application,
/// grouped by FeeType and PaymentStatus. Uses GroupBy aggregation with
/// AsNoTracking for optimised read-only performance.
/// </summary>
public sealed class GetFeeSummaryQueryHandler
    : IRequestHandler<GetFeeSummaryQuery, List<FeeSummaryDto>>
{
    private readonly IRepository<PlanningFee> _feeRepository;

    public GetFeeSummaryQueryHandler(IRepository<PlanningFee> feeRepository)
    {
        _feeRepository = feeRepository;
    }

    public async Task<List<FeeSummaryDto>> Handle(
        GetFeeSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var summary = await _feeRepository.Query()
            .AsNoTracking()
            .Where(f => f.ApplicationId == request.ApplicationId)
            .GroupBy(f => new { f.FeeType, f.PaymentStatus })
            .Select(g => new FeeSummaryDto
            {
                FeeType = g.Key.FeeType.ToString(),
                PaymentStatus = g.Key.PaymentStatus.ToString(),
                TotalAmount = g.Sum(f => f.Amount),
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        return summary;
    }
}
