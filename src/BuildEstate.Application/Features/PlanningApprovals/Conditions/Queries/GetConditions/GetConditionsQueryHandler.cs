using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Queries.GetConditions;

/// <summary>
/// Handles retrieval of a paginated list of planning conditions for a given application,
/// optionally filtered by Status and ConditionType. Ordered by ConditionNumber ascending.
/// Uses AsNoTracking with projection to ConditionDto for optimised read-only performance.
/// </summary>
public sealed class GetConditionsQueryHandler
    : IRequestHandler<GetConditionsQuery, PagedResult<ConditionDto>>
{
    private readonly IRepository<PlanningCondition> _conditionRepository;

    public GetConditionsQueryHandler(IRepository<PlanningCondition> conditionRepository)
    {
        _conditionRepository = conditionRepository;
    }

    public async Task<PagedResult<ConditionDto>> Handle(
        GetConditionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _conditionRepository.Query()
            .AsNoTracking()
            .Where(c => c.ApplicationId == request.ApplicationId);

        // Apply optional Status filter
        if (request.Status.HasValue)
        {
            query = query.Where(c => c.Status == request.Status.Value);
        }

        // Apply optional ConditionType filter
        if (request.ConditionType.HasValue)
        {
            query = query.Where(c => c.ConditionType == request.ConditionType.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination with default guards
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .OrderBy(c => c.ConditionNumber)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ConditionDto
            {
                Id = c.Id,
                ApplicationId = c.ApplicationId,
                ConditionNumber = c.ConditionNumber,
                Description = c.Description,
                ConditionType = c.ConditionType.ToString(),
                Status = c.Status.ToString(),
                DischargeDate = c.DischargeDate,
                DischargeReference = c.DischargeReference,
                DueDate = c.DueDate,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<ConditionDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
