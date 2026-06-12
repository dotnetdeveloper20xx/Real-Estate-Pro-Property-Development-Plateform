namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;

/// <summary>
/// Response DTO for a planning appeal.
/// </summary>
public sealed record AppealDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string AppealGrounds { get; init; } = string.Empty;
    public string AppealType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime LodgedDate { get; init; }
    public string? AppealOutcomeType { get; init; }
    public DateTime? DecisionDate { get; init; }
    public string? DecisionSummary { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
