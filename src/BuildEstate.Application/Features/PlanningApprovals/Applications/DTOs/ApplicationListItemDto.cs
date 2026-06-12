namespace BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;

/// <summary>
/// Lightweight DTO for the planning applications list view.
/// Contains the key fields needed for pipeline management, filtering, and sorting.
/// </summary>
public sealed record ApplicationListItemDto
{
    public Guid Id { get; init; }
    public Guid OpportunityId { get; init; }
    public string Description { get; init; } = string.Empty;
    public string ApplicationType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ApplicationReference { get; init; }
    public string CouncilName { get; init; } = string.Empty;
    public string? LandOpportunityName { get; init; }
    public DateTime? SubmissionDate { get; init; }
    public DateTime? TargetDecisionDate { get; init; }
    public DateTime CreatedAt { get; init; }
}
