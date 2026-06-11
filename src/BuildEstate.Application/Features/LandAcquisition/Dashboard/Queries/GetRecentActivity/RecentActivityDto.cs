namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetRecentActivity;

/// <summary>
/// Represents a single recent activity item on the dashboard,
/// showing the latest status changes across all opportunities.
/// </summary>
public sealed record RecentActivityDto
{
    public Guid OpportunityId { get; init; }
    public string OpportunityName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
    public string UserName { get; init; } = string.Empty;
}
