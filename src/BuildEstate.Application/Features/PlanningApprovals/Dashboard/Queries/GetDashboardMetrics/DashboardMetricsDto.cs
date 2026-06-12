namespace BuildEstate.Application.Features.PlanningApprovals.Dashboard.Queries.GetDashboardMetrics;

/// <summary>
/// DTO containing all dashboard KPI metrics for the planning module.
/// Includes application status counts, decision time metrics, approval/appeal rates,
/// outstanding conditions, overdue milestones, recent activity, and approaching deadlines.
/// </summary>
public sealed record DashboardMetricsDto
{
    /// <summary>Count of applications grouped by their current status.</summary>
    public Dictionary<string, int> StatusCounts { get; init; } = new();

    /// <summary>
    /// Average number of days from SubmissionDate to ActualDecisionDate
    /// for applications that have both dates recorded. Null if no data available.
    /// </summary>
    public double? AverageDecisionTimeDays { get; init; }

    /// <summary>
    /// Percentage of applications with a final decision that were Approved or ApprovedWithConditions.
    /// Formula: (Approved + ApprovedWithConditions) / (Approved + ApprovedWithConditions + Refused) * 100.
    /// Returns 0 when no decided applications exist.
    /// </summary>
    public double ApprovalRatePercent { get; init; }

    /// <summary>
    /// Percentage of appeals with a final decision that were Allowed.
    /// Formula: Allowed / (Allowed + Dismissed) * 100.
    /// Returns 0 when no decided appeals exist.
    /// </summary>
    public double AppealSuccessRatePercent { get; init; }

    /// <summary>Count of planning conditions with Status = Outstanding.</summary>
    public int OutstandingConditionsCount { get; init; }

    /// <summary>Count of planning milestones with Status = Overdue.</summary>
    public int OverdueMilestonesCount { get; init; }

    /// <summary>Last 10 status changes across all applications, ordered most recent first.</summary>
    public List<RecentActivityDto> RecentActivity { get; init; } = new();

    /// <summary>Applications whose TargetDecisionDate falls within the next 14 days.</summary>
    public List<ApproachingDeadlineDto> ApproachingDeadlines { get; init; } = new();
}

/// <summary>
/// Represents a single recent status change activity entry for the dashboard.
/// </summary>
public sealed record RecentActivityDto
{
    public Guid ApplicationId { get; init; }
    public string Description { get; init; } = string.Empty;
    public string PreviousStatus { get; init; } = string.Empty;
    public string NewStatus { get; init; } = string.Empty;
    public string ChangedBy { get; init; } = string.Empty;
    public DateTime ChangedAt { get; init; }
}

/// <summary>
/// Represents an application approaching its target decision date.
/// </summary>
public sealed record ApproachingDeadlineDto
{
    public Guid ApplicationId { get; init; }
    public string Description { get; init; } = string.Empty;
    public DateTime TargetDecisionDate { get; init; }
    public int DaysRemaining { get; init; }
}
