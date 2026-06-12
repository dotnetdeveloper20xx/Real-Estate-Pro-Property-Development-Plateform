namespace BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;

/// <summary>
/// Lightweight summary DTO used for Land Acquisition module integration.
/// Returns the planning status overview for applications linked to a given opportunity.
/// </summary>
public sealed record ApplicationSummaryDto
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public string ApplicationType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string CouncilName { get; init; } = string.Empty;
    public DateTime? SubmissionDate { get; init; }
    public DateTime CreatedAt { get; init; }
}
