namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.DTOs;

/// <summary>
/// Comprehensive dashboard data transfer object containing all metrics,
/// alerts, top opportunities, recent activity, and activity-by-type breakdown
/// for the land acquisition dashboard.
/// </summary>
public sealed record DashboardMetricsDto
{
    // ─── KPI Metrics ───────────────────────────────────────────────────────

    /// <summary>
    /// Count of opportunities grouped by their current status.
    /// </summary>
    public Dictionary<string, int> OpportunitiesByStatus { get; init; } = new();

    /// <summary>
    /// Average number of days from CreatedAt to reaching Acquired status.
    /// </summary>
    public double AverageAcquisitionCycleDays { get; init; }

    /// <summary>
    /// Percentage of opportunities that reached Acquired status.
    /// </summary>
    public double ConversionRatePercent { get; init; }

    /// <summary>
    /// Percentage of due diligence checks with Completed status.
    /// </summary>
    public double DueDiligencePassRatePercent { get; init; }

    /// <summary>
    /// Total number of opportunities that have progressed beyond Identified status.
    /// </summary>
    public int TotalEvaluated { get; init; }

    // ─── Alerts ────────────────────────────────────────────────────────────

    /// <summary>
    /// Count of offers with ValidUntil within the next 7 days
    /// that are not yet Accepted, Rejected, or Expired.
    /// </summary>
    public int OffersExpiringSoon { get; init; }

    /// <summary>
    /// Count of due diligence items with InProgress status where CreatedAt
    /// is older than 14 days and still not Completed or Failed.
    /// </summary>
    public int OverdueDueDiligence { get; init; }

    /// <summary>
    /// Count of approval requests with Pending status.
    /// </summary>
    public int ApprovalsPending { get; init; }

    // ─── Top Opportunities ─────────────────────────────────────────────────

    /// <summary>
    /// Top 5 opportunities ranked by expected sales revenue from feasibility.
    /// </summary>
    public List<TopOpportunityDto> TopOpportunities { get; init; } = new();

    // ─── Recent Activity ───────────────────────────────────────────────────

    /// <summary>
    /// Last 10 recently updated opportunities as activity entries.
    /// </summary>
    public List<RecentActivityItemDto> RecentActivity { get; init; } = new();

    // ─── Activity by Type ──────────────────────────────────────────────────

    /// <summary>
    /// Breakdown of activity by entity type in the last 30 days.
    /// Keys: Due Diligence, Offers, Documents, Opportunities, Approvals, Other.
    /// </summary>
    public Dictionary<string, int> ActivityByType { get; init; } = new();
}

/// <summary>
/// Represents a top-ranked opportunity for the dashboard.
/// </summary>
public sealed record TopOpportunityDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal EstimatedValue { get; init; }
    public string Status { get; init; } = string.Empty;
}

/// <summary>
/// Represents a single recent activity item on the dashboard.
/// </summary>
public sealed record RecentActivityItemDto
{
    public Guid OpportunityId { get; init; }
    public string OpportunityName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
    public string UserName { get; init; } = string.Empty;
}
