using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Queries.GetComplianceChecks;

/// <summary>
/// Handles retrieval of a paginated list of compliance checks for a given requirement.
/// Uses AsNoTracking for optimised read-only queries and projects directly to DTOs.
/// Results are ordered by CheckDate descending and support Outcome and date range filters.
/// </summary>
public sealed class GetComplianceChecksQueryHandler
    : IRequestHandler<GetComplianceChecksQuery, PagedResult<ComplianceCheckDto>>
{
    private readonly IRepository<ComplianceCheck> _repository;

    public GetComplianceChecksQueryHandler(IRepository<ComplianceCheck> repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<ComplianceCheckDto>> Handle(
        GetComplianceChecksQuery request,
        CancellationToken cancellationToken)
    {
        var query = _repository.Query()
            .AsNoTracking()
            .Where(c => c.ComplianceRequirementId == request.ComplianceRequirementId);

        // Apply outcome filter
        if (request.Outcome.HasValue)
        {
            query = query.Where(c => c.Outcome == request.Outcome.Value);
        }

        // Apply date range filter
        if (request.DateFrom.HasValue)
        {
            query = query.Where(c => c.CheckDate >= request.DateFrom.Value);
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(c => c.CheckDate <= request.DateTo.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Order by CheckDate descending (most recent first)
        query = query.OrderByDescending(c => c.CheckDate);

        // Apply pagination
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ComplianceCheckDto
            {
                Id = c.Id,
                ComplianceRequirementId = c.ComplianceRequirementId,
                CheckDate = c.CheckDate,
                Outcome = c.Outcome,
                Findings = c.Findings,
                EvidenceReference = c.EvidenceReference,
                RemediationPlan = c.RemediationPlan,
                RemediationDueDate = c.RemediationDueDate,
                ReviewerUserId = c.ReviewerUserId,
                ReviewerName = c.ReviewerName,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<ComplianceCheckDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
