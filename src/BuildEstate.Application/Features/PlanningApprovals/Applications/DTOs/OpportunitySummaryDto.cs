namespace BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;

/// <summary>
/// Lightweight summary DTO for the linked LandOpportunity,
/// displayed within planning application detail views.
/// </summary>
public sealed record OpportunitySummaryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal LandSize { get; init; }
    public string Status { get; init; } = string.Empty;
}
