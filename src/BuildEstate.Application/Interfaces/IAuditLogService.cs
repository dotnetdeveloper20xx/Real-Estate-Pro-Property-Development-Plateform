using BuildEstate.Application.Common;
using BuildEstate.Domain.Entities.UserManagement;

namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides append-only audit log operations: creating immutable entries
/// and querying with pagination and filtering.
/// No update or delete operations are exposed — audit records are immutable.
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Persists an immutable audit log entry. The entry's Timestamp and Id
    /// are set at creation time and cannot be modified afterwards.
    /// </summary>
    /// <param name="entry">The audit log entry to persist.</param>
    /// <param name="ct">Cancellation token.</param>
    Task LogAsync(AuditLogEntry entry, CancellationToken ct = default);

    /// <summary>
    /// Queries audit log entries with pagination and filtering.
    /// Supports filtering by action type, user ID, and date range (max 12-month span).
    /// </summary>
    /// <param name="queryParams">The query parameters including filters and pagination.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A paginated result of audit log entries ordered by timestamp descending.</returns>
    Task<PagedResult<AuditLogEntry>> QueryAsync(
        AuditLogQueryParams queryParams, CancellationToken ct = default);
}
