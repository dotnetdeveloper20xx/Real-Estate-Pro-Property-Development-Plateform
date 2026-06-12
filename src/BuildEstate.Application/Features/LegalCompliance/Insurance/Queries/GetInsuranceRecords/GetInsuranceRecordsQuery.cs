using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Queries.GetInsuranceRecords;

/// <summary>
/// Query to retrieve a paginated, filtered, sorted, and searchable list of insurance records.
/// Supports filtering by CoverageType, Status, Insurer, expiry date range,
/// and free-text search across PolicyNumber and Insurer fields.
/// </summary>
public sealed record GetInsuranceRecordsQuery : IRequest<PagedResult<InsuranceRecordListItemDto>>
{
    /// <summary>Optional filter by coverage type.</summary>
    public CoverageType? CoverageType { get; init; }

    /// <summary>Optional filter by insurance status.</summary>
    public InsuranceStatus? Status { get; init; }

    /// <summary>Optional filter by insurer name (partial match).</summary>
    public string? Insurer { get; init; }

    /// <summary>Optional filter for expiry date range start (inclusive).</summary>
    public DateTime? ExpiryDateFrom { get; init; }

    /// <summary>Optional filter for expiry date range end (inclusive).</summary>
    public DateTime? ExpiryDateTo { get; init; }

    /// <summary>Optional free-text search across PolicyNumber and Insurer.</summary>
    public string? SearchTerm { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>Optional sort field: ExpiryDate, CoverAmount, PolicyNumber, Insurer, Status, CreatedAt.</summary>
    public string? SortBy { get; init; }

    /// <summary>Sort direction: "asc" or "desc". Defaults to "asc" (soonest expiry first) when sorting by ExpiryDate.</summary>
    public string? SortDirection { get; init; }
}
