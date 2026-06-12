using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCases;

/// <summary>
/// Handles retrieval of a paginated, filtered, sorted, and searchable list of legal cases.
/// Uses AsNoTracking for optimised read-only queries and projects directly to DTOs.
/// Calculates DaysSinceLastStatusChange based on UpdatedAt or CreatedAt.
/// </summary>
public sealed class GetLegalCasesQueryHandler
    : IRequestHandler<GetLegalCasesQuery, PagedResult<LegalCaseListItemDto>>
{
    private readonly IRepository<LegalCase> _repository;

    public GetLegalCasesQueryHandler(IRepository<LegalCase> repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<LegalCaseListItemDto>> Handle(
        GetLegalCasesQuery request,
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

        var now = DateTime.UtcNow;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new LegalCaseListItemDto
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
            })
            .ToListAsync(cancellationToken);

        return PagedResult<LegalCaseListItemDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static IQueryable<LegalCase> ApplyFilters(
        IQueryable<LegalCase> query,
        GetLegalCasesQuery request)
    {
        if (request.Status.HasValue)
        {
            query = query.Where(c => c.Status == request.Status.Value);
        }

        if (request.CaseType.HasValue)
        {
            query = query.Where(c => c.CaseType == request.CaseType.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(c => c.Priority == request.Priority.Value);
        }

        return query;
    }

    private static IQueryable<LegalCase> ApplySearch(
        IQueryable<LegalCase> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        var term = searchTerm.Trim();

        return query.Where(c =>
            c.Title.Contains(term) ||
            c.CaseReference.Contains(term) ||
            (c.AssignedSolicitor != null && c.AssignedSolicitor.Contains(term)));
    }

    private static IQueryable<LegalCase> ApplySorting(
        IQueryable<LegalCase> query,
        string? sortBy,
        string? sortDirection)
    {
        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLowerInvariant() switch
        {
            "title" => isDescending
                ? query.OrderByDescending(c => c.Title)
                : query.OrderBy(c => c.Title),

            "casereference" => isDescending
                ? query.OrderByDescending(c => c.CaseReference)
                : query.OrderBy(c => c.CaseReference),

            "createdat" => isDescending
                ? query.OrderByDescending(c => c.CreatedAt)
                : query.OrderBy(c => c.CreatedAt),

            "priority" => isDescending
                ? query.OrderByDescending(c => c.Priority)
                : query.OrderBy(c => c.Priority),

            "status" => isDescending
                ? query.OrderByDescending(c => c.Status)
                : query.OrderBy(c => c.Status),

            "casetype" => isDescending
                ? query.OrderByDescending(c => c.CaseType)
                : query.OrderBy(c => c.CaseType),

            _ => query.OrderByDescending(c => c.CreatedAt) // Default sort: newest first
        };
    }
}
