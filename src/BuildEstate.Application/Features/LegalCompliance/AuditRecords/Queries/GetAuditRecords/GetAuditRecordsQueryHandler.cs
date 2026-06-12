using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Queries.GetAuditRecords;

/// <summary>
/// Handles retrieval of a paginated, filtered, sorted list of audit records.
/// Uses AsNoTracking for optimised read-only queries and projects directly to DTOs.
/// </summary>
public sealed class GetAuditRecordsQueryHandler
    : IRequestHandler<GetAuditRecordsQuery, PagedResult<AuditRecordListItemDto>>
{
    private readonly IRepository<AuditRecord> _repository;

    public GetAuditRecordsQueryHandler(IRepository<AuditRecord> repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<AuditRecordListItemDto>> Handle(
        GetAuditRecordsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _repository.Query().AsNoTracking();

        // Apply filters
        query = ApplyFilters(query, request);

        // Apply free-text search
        query = ApplySearch(query, request.SearchTerm);

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = ApplySorting(query, request.SortBy, request.SortDirection);

        // Apply pagination
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditRecordListItemDto
            {
                Id = a.Id,
                AuditType = a.AuditType.ToString(),
                Scope = a.Scope,
                AuditorName = a.AuditorName,
                AuditDate = a.AuditDate,
                Status = a.Status.ToString(),
                RiskRating = a.RiskRating.HasValue ? a.RiskRating.Value.ToString() : null,
                IsOverdue = a.IsOverdue,
                ActionDueDate = a.ActionDueDate
            })
            .ToListAsync(cancellationToken);

        return PagedResult<AuditRecordListItemDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static IQueryable<AuditRecord> ApplyFilters(
        IQueryable<AuditRecord> query,
        GetAuditRecordsQuery request)
    {
        if (request.AuditType.HasValue)
        {
            query = query.Where(a => a.AuditType == request.AuditType.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        if (request.RiskRating.HasValue)
        {
            query = query.Where(a => a.RiskRating == request.RiskRating.Value);
        }

        if (request.DateFrom.HasValue)
        {
            query = query.Where(a => a.AuditDate >= request.DateFrom.Value);
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(a => a.AuditDate <= request.DateTo.Value);
        }

        return query;
    }

    private static IQueryable<AuditRecord> ApplySearch(
        IQueryable<AuditRecord> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        var term = searchTerm.Trim();

        return query.Where(a =>
            a.Scope.Contains(term) ||
            a.AuditorName.Contains(term));
    }

    private static IQueryable<AuditRecord> ApplySorting(
        IQueryable<AuditRecord> query,
        string? sortBy,
        string? sortDirection)
    {
        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLowerInvariant() switch
        {
            "auditdate" => isDescending
                ? query.OrderByDescending(a => a.AuditDate)
                : query.OrderBy(a => a.AuditDate),

            "status" => isDescending
                ? query.OrderByDescending(a => a.Status)
                : query.OrderBy(a => a.Status),

            "riskrating" => isDescending
                ? query.OrderByDescending(a => a.RiskRating)
                : query.OrderBy(a => a.RiskRating),

            _ => query.OrderByDescending(a => a.AuditDate) // Default sort: newest first
        };
    }
}
