using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditTrail.Queries.GetAuditHistory;

/// <summary>
/// Query to retrieve a paginated, filtered audit trail history.
/// Supports filtering by action type, entity type, user, and date range.
/// Results are ordered chronologically (newest first by default).
/// </summary>
public sealed record GetAuditHistoryQuery : IRequest<PagedResult<AuditHistoryDto>>
{
    /// <summary>Optional filter by action type (Create, Update, Delete).</summary>
    public string? Action { get; init; }

    /// <summary>Optional filter by entity type name (e.g., LegalCase, Contract).</summary>
    public string? EntityName { get; init; }

    /// <summary>Optional filter by user ID who performed the action.</summary>
    public string? UserId { get; init; }

    /// <summary>Optional filter: start of date range (inclusive, UTC).</summary>
    public DateTime? FromDate { get; init; }

    /// <summary>Optional filter: end of date range (inclusive, UTC).</summary>
    public DateTime? ToDate { get; init; }

    /// <summary>Optional filter by entity ID.</summary>
    public string? EntityId { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 20.</summary>
    public int PageSize { get; init; } = 20;
}
