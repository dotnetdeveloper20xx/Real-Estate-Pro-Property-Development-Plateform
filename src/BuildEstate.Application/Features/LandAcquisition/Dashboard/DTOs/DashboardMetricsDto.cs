namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.DTOs;

/// <summary>
/// Data transfer object containing dashboard KPI metrics for the
/// land acquisition module.
/// </summary>
public sealed record DashboardMetricsDto
{
    /// <summary>
    /// Count of opportunities grouped by their current status.
    /// </summary>
    public Dictionary<string, int> OpportunitiesByStatus { get; init; } = new();

    /// <summary>
    /// Average number of days from CreatedAt to reaching Acquired status,
    /// calculated across all acquired opportunities.
    /// </summary>
    public double AverageAcquisitionCycleDays { get; init; }

    /// <summary>
    /// Percentage of opportunities that reached Acquired status
    /// out of the total number of opportunities.
    /// </summary>
    public double ConversionRatePercent { get; init; }

    /// <summary>
    /// Percentage of due diligence checks with Completed status
    /// out of the total number of due diligence records.
    /// </summary>
    public double DueDiligencePassRatePercent { get; init; }

    /// <summary>
    /// Total number of opportunities that have progressed beyond
    /// the Identified status (i.e., have been evaluated).
    /// </summary>
    public int TotalEvaluated { get; init; }
}
