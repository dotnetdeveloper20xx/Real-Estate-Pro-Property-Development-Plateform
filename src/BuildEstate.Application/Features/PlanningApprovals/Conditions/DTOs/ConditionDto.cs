namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;

/// <summary>
/// Response DTO for a created or retrieved planning condition.
/// </summary>
public sealed record ConditionDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public int ConditionNumber { get; init; }
    public string Description { get; init; } = string.Empty;
    public string ConditionType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime? DischargeDate { get; init; }
    public string? DischargeReference { get; init; }
    public DateTime? DueDate { get; init; }
    public DateTime CreatedAt { get; init; }
}
