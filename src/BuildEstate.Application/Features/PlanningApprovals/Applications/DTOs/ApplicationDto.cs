namespace BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;

/// <summary>
/// Response DTO for a created or retrieved planning application.
/// </summary>
public sealed record ApplicationDto
{
    public Guid Id { get; init; }
    public Guid OpportunityId { get; init; }
    public string Description { get; init; } = string.Empty;
    public string ApplicationType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ApplicationReference { get; init; }
    public string CouncilName { get; init; } = string.Empty;
    public DateTime? SubmissionDate { get; init; }
    public DateTime? TargetDecisionDate { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
