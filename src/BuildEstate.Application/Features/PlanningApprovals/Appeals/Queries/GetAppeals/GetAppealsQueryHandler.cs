using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Queries.GetAppeals;

/// <summary>
/// Handles retrieval of a paginated list of planning appeals for a given application.
/// Ordered by LodgedDate descending (newest first).
/// Uses AsNoTracking with projection to AppealDto for optimised read-only performance.
/// </summary>
public sealed class GetAppealsQueryHandler
    : IRequestHandler<GetAppealsQuery, PagedResult<AppealDto>>
{
    private readonly IRepository<PlanningAppeal> _appealRepository;

    public GetAppealsQueryHandler(IRepository<PlanningAppeal> appealRepository)
    {
        _appealRepository = appealRepository;
    }

    public async Task<PagedResult<AppealDto>> Handle(
        GetAppealsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _appealRepository.Query()
            .AsNoTracking()
            .Where(a => a.ApplicationId == request.ApplicationId);

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination with default guards
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .OrderByDescending(a => a.LodgedDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AppealDto
            {
                Id = a.Id,
                ApplicationId = a.ApplicationId,
                AppealGrounds = a.AppealGrounds,
                AppealType = a.AppealType.ToString(),
                Status = a.Status.ToString(),
                LodgedDate = a.LodgedDate,
                AppealOutcomeType = a.AppealOutcomeType != null ? a.AppealOutcomeType.Value.ToString() : null,
                DecisionDate = a.DecisionDate,
                DecisionSummary = a.DecisionSummary,
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return PagedResult<AppealDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
