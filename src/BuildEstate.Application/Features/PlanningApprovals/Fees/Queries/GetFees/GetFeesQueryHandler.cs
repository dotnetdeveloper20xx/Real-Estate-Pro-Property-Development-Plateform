using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Queries.GetFees;

/// <summary>
/// Handles retrieval of a paginated list of planning fees for a given application,
/// optionally filtered by FeeType and PaymentStatus. Ordered by CreatedAt descending.
/// Uses AsNoTracking with projection to FeeDto for optimised read-only performance.
/// </summary>
public sealed class GetFeesQueryHandler
    : IRequestHandler<GetFeesQuery, PagedResult<FeeDto>>
{
    private readonly IRepository<PlanningFee> _feeRepository;

    public GetFeesQueryHandler(IRepository<PlanningFee> feeRepository)
    {
        _feeRepository = feeRepository;
    }

    public async Task<PagedResult<FeeDto>> Handle(
        GetFeesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _feeRepository.Query()
            .AsNoTracking()
            .Where(f => f.ApplicationId == request.ApplicationId);

        // Apply optional FeeType filter
        if (request.FeeType.HasValue)
        {
            query = query.Where(f => f.FeeType == request.FeeType.Value);
        }

        // Apply optional PaymentStatus filter
        if (request.PaymentStatus.HasValue)
        {
            query = query.Where(f => f.PaymentStatus == request.PaymentStatus.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination with default guards
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FeeDto
            {
                Id = f.Id,
                ApplicationId = f.ApplicationId,
                Amount = f.Amount,
                Currency = f.Currency,
                FeeType = f.FeeType.ToString(),
                Description = f.Description,
                PaymentStatus = f.PaymentStatus.ToString(),
                ApprovedBy = f.ApprovedBy,
                ApprovedAt = f.ApprovedAt,
                ApprovalNotes = f.ApprovalNotes,
                CreatedAt = f.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<FeeDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
