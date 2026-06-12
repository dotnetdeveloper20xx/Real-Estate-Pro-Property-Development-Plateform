namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;

/// <summary>
/// Response DTO for a created or retrieved planning milestone.
/// </summary>
public sealed record MilestoneDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string MilestoneType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime TargetDate { get; init; }
    public DateTime? ActualDate { get; init; }
    public int? VarianceDays { get; init; }
    public DateTime CreatedAt { get; init; }
}
