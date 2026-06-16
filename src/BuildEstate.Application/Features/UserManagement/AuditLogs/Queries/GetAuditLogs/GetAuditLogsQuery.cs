using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.AuditLogs.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.AuditLogs.Queries.GetAuditLogs;

/// <summary>
/// Query to retrieve paginated, filterable audit log entries.
/// Accessible only by SuperAdmin users.
/// Supports filtering by action type, user, and date range (max 12 months).
/// Page sizes: 10, 25, 50, 100 (default 25).
/// </summary>
public sealed record GetAuditLogsQuery : IRequest<GetAuditLogsResult>
{
    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int Page { get; init; } = 1;

    /// <summary>Number of items per page. Allowed values: 10, 25, 50, 100. Defaults to 25.</summary>
    public int PageSize { get; init; } = 25;

    /// <summary>Optional filter by action type (e.g., "UserLogin").</summary>
    public string? ActionType { get; init; }

    /// <summary>Optional filter by user who performed the action.</summary>
    public string? UserId { get; init; }

    /// <summary>Optional start of date range filter (inclusive, UTC).</summary>
    public DateTime? DateRangeStart { get; init; }

    /// <summary>Optional end of date range filter (inclusive, UTC).</summary>
    public DateTime? DateRangeEnd { get; init; }
}

/// <summary>
/// Result of the audit log query, containing paginated entries or empty state.
/// </summary>
public sealed record GetAuditLogsResult
{
    /// <summary>The paginated audit log entries.</summary>
    public PagedResult<AuditLogEntryDto> Entries { get; init; } = PagedResult<AuditLogEntryDto>.Create(new(), 0, 1, 25);

    /// <summary>
    /// When true, no records matched the applied filters.
    /// UI should display: "No records found for the selected criteria."
    /// </summary>
    public bool IsEmpty => Entries.TotalCount == 0;

    /// <summary>
    /// Message to display when no records match.
    /// </summary>
    public string? EmptyStateMessage => IsEmpty
        ? "No records found for the selected criteria. Try adjusting your filters."
        : null;
}
