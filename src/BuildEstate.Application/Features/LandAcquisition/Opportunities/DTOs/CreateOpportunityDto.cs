namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

/// <summary>
/// DTO for creating a new land opportunity.
/// </summary>
public sealed record CreateOpportunityDto
{
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal LandSize { get; init; }
    public string? Source { get; init; }
    public DateTime? ExpectedAcquisition { get; init; }
}
