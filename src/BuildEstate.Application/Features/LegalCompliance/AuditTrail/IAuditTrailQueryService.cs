using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail.DTOs;

namespace BuildEstate.Application.Features.LegalCompliance.AuditTrail;

/// <summary>
/// Service interface for querying the immutable audit trail.
/// Provides paginated history retrieval and export capabilities.
/// Implemented in the Infrastructure layer against the AuditLogs DbSet.
/// </summary>
public interface IAuditTrailQueryService
{
    /// <summary>
    /// Retrieves a paginated, filtered list of audit log entries.
    /// </summary>
    /// <param name="action">Optional filter by action type (Create, Update, Delete).</param>
    /// <param name="entityName">Optional filter by entity type name.</param>
    /// <param name="userId">Optional filter by user ID.</param>
    /// <param name="entityId">Optional filter by entity ID.</param>
    /// <param name="fromDate">Optional inclusive start of date range (UTC).</param>
    /// <param name="toDate">Optional inclusive end of date range (UTC).</param>
    /// <param name="pageNumber">Page number (1-based).</param>
    /// <param name="pageSize">Number of items per page.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated result of audit history DTOs ordered by timestamp descending.</returns>
    Task<PagedResult<AuditHistoryDto>> GetAuditHistoryAsync(
        string? action,
        string? entityName,
        string? userId,
        string? entityId,
        DateTime? fromDate,
        DateTime? toDate,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all audit log entries matching the specified filters for CSV export.
    /// </summary>
    /// <param name="entityName">Optional filter by entity type name.</param>
    /// <param name="fromDate">Required inclusive start of date range (UTC).</param>
    /// <param name="toDate">Required inclusive end of date range (UTC).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of audit export DTOs ordered by timestamp ascending for chronological export.</returns>
    Task<List<AuditExportDto>> GetAuditTrailForExportAsync(
        string? entityName,
        DateTime fromDate,
        DateTime toDate,
        CancellationToken cancellationToken = default);
}
