namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides read-only access to audit log records for querying purposes.
/// Used by dashboard and reporting handlers that need to surface recent activity.
/// </summary>
public interface IAuditLogQueryService
{
    /// <summary>
    /// Retrieves the most recent audit log entries for a given entity type
    /// where a specific column was modified.
    /// </summary>
    /// <param name="entityName">The entity type name (e.g., "PlanningApplication").</param>
    /// <param name="affectedColumn">The column that must have been affected (e.g., "Status").</param>
    /// <param name="count">Maximum number of entries to return.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A list of audit entry DTOs ordered by timestamp descending.</returns>
    Task<List<AuditEntryDto>> GetRecentChangesAsync(
        string entityName,
        string affectedColumn,
        int count,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves the most recent audit log entries across multiple entity types.
    /// Used by the legal dashboard to show the latest activities.
    /// </summary>
    /// <param name="entityNames">The entity type names to include.</param>
    /// <param name="count">Maximum number of entries to return.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A list of audit entry DTOs ordered by timestamp descending.</returns>
    Task<List<AuditEntryDto>> GetRecentActivitiesAsync(
        IReadOnlyList<string> entityNames,
        int count,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Lightweight DTO representing a single audit log entry for query results.
/// </summary>
public sealed record AuditEntryDto
{
    public string EntityId { get; init; } = string.Empty;
    public string EntityName { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string? OldValues { get; init; }
    public string? NewValues { get; init; }
    public string UserName { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
}
