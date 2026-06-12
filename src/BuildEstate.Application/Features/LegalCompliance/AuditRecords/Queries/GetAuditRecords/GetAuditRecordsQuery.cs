using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Queries.GetAuditRecords;

/// <summary>
/// Query to retrieve a paginated, filtered, sorted list of audit records.
/// Supports filtering by AuditType, Status, RiskRating, date range, and free-text search
/// across Scope and AuditorName fields.
/// </summary>
public sealed record GetAuditRecordsQuery : IRequest<PagedResult<AuditRecordListItemDto>>
{
    /// <summary>Optional filter by audit type.</summary>
    public AuditType? AuditType { get; init; }

    /// <summary>Optional filter by audit record status.</summary>
    public AuditRecordStatus? Status { get; init; }

    /// <summary>Optional filter by risk rating.</summary>
    public RiskRating? RiskRating { get; init; }

    /// <summary>Optional filter for audit records on or after this date.</summary>
    public DateTime? DateFrom { get; init; }

    /// <summary>Optional filter for audit records on or before this date.</summary>
    public DateTime? DateTo { get; init; }

    /// <summary>Optional free-text search across Scope and AuditorName.</summary>
    public string? SearchTerm { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>Optional sort field: AuditDate, Status, RiskRating.</summary>
    public string? SortBy { get; init; }

    /// <summary>Sort direction: "asc" or "desc". Defaults to "desc" (newest first).</summary>
    public string? SortDirection { get; init; }
}
