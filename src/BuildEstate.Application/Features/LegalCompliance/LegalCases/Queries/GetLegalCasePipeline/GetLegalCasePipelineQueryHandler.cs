using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCasePipeline;

/// <summary>
/// Handles retrieval of all non-deleted legal cases grouped by status for
/// pipeline/kanban board visualisation. Uses AsNoTracking for read-only access.
/// </summary>
public sealed class GetLegalCasePipelineQueryHandler
    : IRequestHandler<GetLegalCasePipelineQuery, List<LegalCasePipelineDto>>
{
    private readonly IRepository<LegalCase> _repository;

    public GetLegalCasePipelineQueryHandler(IRepository<LegalCase> repository)
    {
        _repository = repository;
    }

    public async Task<List<LegalCasePipelineDto>> Handle(
        GetLegalCasePipelineQuery request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var cases = await _repository
            .Query()
            .AsNoTracking()
            .Select(c => new
            {
                c.Id,
                c.CaseReference,
                c.Title,
                c.CaseType,
                c.Status,
                c.Priority,
                c.AssignedSolicitor,
                c.OpportunityId,
                c.CreatedAt,
                c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var pipeline = cases
            .GroupBy(c => c.Status)
            .Select(group => new LegalCasePipelineDto
            {
                Status = group.Key,
                Cases = group.Select(c => new LegalCaseListItemDto
                {
                    Id = c.Id,
                    CaseReference = c.CaseReference,
                    Title = c.Title,
                    CaseType = c.CaseType,
                    Status = c.Status,
                    Priority = c.Priority,
                    AssignedSolicitor = c.AssignedSolicitor,
                    OpportunityId = c.OpportunityId,
                    CreatedAt = c.CreatedAt,
                    DaysSinceLastStatusChange = (int)(now - (c.UpdatedAt ?? c.CreatedAt)).TotalDays
                }).ToList(),
                Count = group.Count()
            })
            .OrderBy(p => p.Status)
            .ToList();

        // Ensure all statuses are represented even if empty
        var allStatuses = Enum.GetValues<LegalCaseStatus>();
        var existingStatuses = pipeline.Select(p => p.Status).ToHashSet();

        foreach (var status in allStatuses)
        {
            if (!existingStatuses.Contains(status))
            {
                pipeline.Add(new LegalCasePipelineDto
                {
                    Status = status,
                    Cases = new List<LegalCaseListItemDto>(),
                    Count = 0
                });
            }
        }

        return pipeline.OrderBy(p => p.Status).ToList();
    }
}
