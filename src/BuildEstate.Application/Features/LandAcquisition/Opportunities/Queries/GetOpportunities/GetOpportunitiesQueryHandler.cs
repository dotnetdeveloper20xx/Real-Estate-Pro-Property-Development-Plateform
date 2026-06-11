using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunities;

/// <summary>
/// Handles retrieval of a paginated, filtered, sorted, and searchable list of land opportunities.
/// Uses AsNoTracking for optimised read-only queries and projects directly to DTOs.
/// </summary>
public sealed class GetOpportunitiesQueryHandler
    : IRequestHandler<GetOpportunitiesQuery, PagedResult<OpportunityListItemDto>>
{
    private readonly IRepository<LandOpportunity> _repository;

    public GetOpportunitiesQueryHandler(IRepository<LandOpportunity> repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<OpportunityListItemDto>> Handle(
        GetOpportunitiesQuery request,
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
            .Select(o => new OpportunityListItemDto
            {
                Id = o.Id,
                Name = o.Name,
                Location = o.Location,
                LandSize = o.LandSize,
                Status = o.Status.ToString(),
                Source = o.Source,
                ExpectedAcquisition = o.ExpectedAcquisition,
                CreatedAt = o.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<OpportunityListItemDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static IQueryable<LandOpportunity> ApplyFilters(
        IQueryable<LandOpportunity> query,
        GetOpportunitiesQuery request)
    {
        if (request.Status.HasValue)
        {
            query = query.Where(o => o.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            query = query.Where(o => o.Location.Contains(request.Location));
        }

        if (!string.IsNullOrWhiteSpace(request.Source))
        {
            query = query.Where(o => o.Source != null && o.Source.Contains(request.Source));
        }

        if (request.ExpectedAcquisitionFrom.HasValue)
        {
            query = query.Where(o => o.ExpectedAcquisition >= request.ExpectedAcquisitionFrom.Value);
        }

        if (request.ExpectedAcquisitionTo.HasValue)
        {
            query = query.Where(o => o.ExpectedAcquisition <= request.ExpectedAcquisitionTo.Value);
        }

        return query;
    }

    private static IQueryable<LandOpportunity> ApplySearch(
        IQueryable<LandOpportunity> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        var term = searchTerm.Trim();

        return query.Where(o =>
            o.Name.Contains(term) ||
            o.Location.Contains(term) ||
            (o.Source != null && o.Source.Contains(term)));
    }

    private static IQueryable<LandOpportunity> ApplySorting(
        IQueryable<LandOpportunity> query,
        string? sortBy,
        string? sortDirection)
    {
        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLowerInvariant() switch
        {
            "name" => isDescending
                ? query.OrderByDescending(o => o.Name)
                : query.OrderBy(o => o.Name),

            "createdat" => isDescending
                ? query.OrderByDescending(o => o.CreatedAt)
                : query.OrderBy(o => o.CreatedAt),

            "landsize" => isDescending
                ? query.OrderByDescending(o => o.LandSize)
                : query.OrderBy(o => o.LandSize),

            "expectedacquisition" => isDescending
                ? query.OrderByDescending(o => o.ExpectedAcquisition)
                : query.OrderBy(o => o.ExpectedAcquisition),

            "status" => isDescending
                ? query.OrderByDescending(o => o.Status)
                : query.OrderBy(o => o.Status),

            _ => query.OrderByDescending(o => o.CreatedAt) // Default sort: newest first
        };
    }
}
