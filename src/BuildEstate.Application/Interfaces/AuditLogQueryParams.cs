namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Parameters for querying audit log entries with pagination and filtering.
/// Supports filtering by action type, user, and date range.
/// </summary>
public sealed record AuditLogQueryParams
{
    /// <summary>
    /// Filter by action type (e.g., "UserLogin", "UserDeactivated").
    /// Null or empty means no action filter is applied.
    /// </summary>
    public string? ActionType { get; init; }

    /// <summary>
    /// Filter by the user who performed the action (PerformedByUserId).
    /// Null or empty means no user filter is applied.
    /// </summary>
    public string? UserId { get; init; }

    /// <summary>
    /// Start of the date range filter (inclusive, UTC).
    /// Null means no lower bound on the date range.
    /// </summary>
    public DateTime? DateRangeStart { get; init; }

    /// <summary>
    /// End of the date range filter (inclusive, UTC).
    /// Null means no upper bound on the date range.
    /// </summary>
    public DateTime? DateRangeEnd { get; init; }

    /// <summary>
    /// Page number (1-based). Defaults to 1.
    /// </summary>
    public int Page { get; init; } = 1;

    /// <summary>
    /// Number of items per page. Must be one of: 10, 25, 50, 100.
    /// Defaults to 25.
    /// </summary>
    public int PageSize { get; init; } = 25;

    /// <summary>
    /// Allowed page sizes for audit log queries.
    /// </summary>
    public static readonly int[] AllowedPageSizes = [10, 25, 50, 100];

    /// <summary>
    /// Maximum allowed date range span in months.
    /// </summary>
    public const int MaxDateRangeMonths = 12;
}
