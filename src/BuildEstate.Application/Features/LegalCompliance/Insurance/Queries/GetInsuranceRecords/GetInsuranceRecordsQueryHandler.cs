using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Queries.GetInsuranceRecords;

/// <summary>
/// Handles retrieval of a paginated, filtered, sorted, and searchable list of insurance records.
/// Uses AsNoTracking for optimised read-only queries and projects directly to DTOs.
/// Calculates DaysUntilExpiry in the projection based on ExpiryDate relative to UTC now.
/// </summary>
public sealed class GetInsuranceRecordsQueryHandler
    : IRequestHandler<GetInsuranceRecordsQuery, PagedResult<InsuranceRecordListItemDto>>
{
    private readonly IRepository<InsuranceRecord> _repository;

    public GetInsuranceRecordsQueryHandler(IRepository<InsuranceRecord> repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<InsuranceRecordListItemDto>> Handle(
        GetInsuranceRecordsQuery request,
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
            .Select(i => new InsuranceRecordListItemDto
            {
                Id = i.Id,
                PolicyNumber = i.PolicyNumber,
                Insurer = i.Insurer,
                CoverageType = i.CoverageType,
                CoverAmount = i.CoverAmount,
                Currency = i.Currency,
                ExpiryDate = i.ExpiryDate,
                Status = i.Status,
                DaysUntilExpiry = (int)(i.ExpiryDate - now).TotalDays
            })
            .ToListAsync(cancellationToken);

        return PagedResult<InsuranceRecordListItemDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static IQueryable<InsuranceRecord> ApplyFilters(
        IQueryable<InsuranceRecord> query,
        GetInsuranceRecordsQuery request)
    {
        if (request.CoverageType.HasValue)
        {
            query = query.Where(i => i.CoverageType == request.CoverageType.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(i => i.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Insurer))
        {
            var insurer = request.Insurer.Trim();
            query = query.Where(i => i.Insurer.Contains(insurer));
        }

        if (request.ExpiryDateFrom.HasValue)
        {
            query = query.Where(i => i.ExpiryDate >= request.ExpiryDateFrom.Value);
        }

        if (request.ExpiryDateTo.HasValue)
        {
            query = query.Where(i => i.ExpiryDate <= request.ExpiryDateTo.Value);
        }

        return query;
    }

    private static IQueryable<InsuranceRecord> ApplySearch(
        IQueryable<InsuranceRecord> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        var term = searchTerm.Trim();

        return query.Where(i =>
            i.PolicyNumber.Contains(term) ||
            i.Insurer.Contains(term));
    }

    private static IQueryable<InsuranceRecord> ApplySorting(
        IQueryable<InsuranceRecord> query,
        string? sortBy,
        string? sortDirection)
    {
        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLowerInvariant() switch
        {
            "expirydate" => isDescending
                ? query.OrderByDescending(i => i.ExpiryDate)
                : query.OrderBy(i => i.ExpiryDate),

            "coveramount" => isDescending
                ? query.OrderByDescending(i => i.CoverAmount)
                : query.OrderBy(i => i.CoverAmount),

            "policynumber" => isDescending
                ? query.OrderByDescending(i => i.PolicyNumber)
                : query.OrderBy(i => i.PolicyNumber),

            "insurer" => isDescending
                ? query.OrderByDescending(i => i.Insurer)
                : query.OrderBy(i => i.Insurer),

            "status" => isDescending
                ? query.OrderByDescending(i => i.Status)
                : query.OrderBy(i => i.Status),

            "createdat" => isDescending
                ? query.OrderByDescending(i => i.CreatedAt)
                : query.OrderBy(i => i.CreatedAt),

            _ => query.OrderBy(i => i.ExpiryDate) // Default sort: soonest expiry first
        };
    }
}
