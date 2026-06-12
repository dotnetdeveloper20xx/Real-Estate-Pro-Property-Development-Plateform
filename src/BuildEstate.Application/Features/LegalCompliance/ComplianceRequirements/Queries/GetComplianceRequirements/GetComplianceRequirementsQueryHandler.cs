using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceRequirements;

/// <summary>
/// Handles retrieval of a paginated, filtered, sorted, and searchable list of compliance requirements.
/// Uses AsNoTracking for optimised read-only queries and projects directly to DTOs.
/// </summary>
public sealed class GetComplianceRequirementsQueryHandler
    : IRequestHandler<GetComplianceRequirementsQuery, PagedResult<ComplianceRequirementDto>>
{
    private readonly IRepository<ComplianceRequirement> _repository;

    public GetComplianceRequirementsQueryHandler(IRepository<ComplianceRequirement> repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<ComplianceRequirementDto>> Handle(
        GetComplianceRequirementsQuery request,
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
            .Select(r => new ComplianceRequirementDto
            {
                Id = r.Id,
                Name = r.Name,
                Category = r.Category,
                Description = r.Description,
                SourceRegulation = r.SourceRegulation,
                Frequency = r.Frequency,
                ResponsibleRole = r.ResponsibleRole,
                Status = r.Status,
                RetirementReason = r.RetirementReason,
                NextDueDate = r.NextDueDate,
                CreatedAt = r.CreatedAt,
                CreatedBy = r.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return PagedResult<ComplianceRequirementDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static IQueryable<ComplianceRequirement> ApplyFilters(
        IQueryable<ComplianceRequirement> query,
        GetComplianceRequirementsQuery request)
    {
        if (request.Category.HasValue)
        {
            query = query.Where(r => r.Category == request.Category.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        if (request.Frequency.HasValue)
        {
            query = query.Where(r => r.Frequency == request.Frequency.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.ResponsibleRole))
        {
            var role = request.ResponsibleRole.Trim();
            query = query.Where(r => r.ResponsibleRole == role);
        }

        return query;
    }

    private static IQueryable<ComplianceRequirement> ApplySearch(
        IQueryable<ComplianceRequirement> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        var term = searchTerm.Trim();

        return query.Where(r =>
            r.Name.Contains(term) ||
            r.Description.Contains(term));
    }

    private static IQueryable<ComplianceRequirement> ApplySorting(
        IQueryable<ComplianceRequirement> query,
        string? sortBy,
        string? sortDirection)
    {
        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLowerInvariant() switch
        {
            "name" => isDescending
                ? query.OrderByDescending(r => r.Name)
                : query.OrderBy(r => r.Name),

            "category" => isDescending
                ? query.OrderByDescending(r => r.Category)
                : query.OrderBy(r => r.Category),

            "createdat" => isDescending
                ? query.OrderByDescending(r => r.CreatedAt)
                : query.OrderBy(r => r.CreatedAt),

            _ => query.OrderByDescending(r => r.CreatedAt) // Default sort: newest first
        };
    }
}
