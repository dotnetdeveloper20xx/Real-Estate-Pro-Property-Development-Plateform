namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

/// <summary>
/// DTO for updating an existing land opportunity.
/// </summary>
public sealed record UpdateOpportunityDto
{
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal LandSize { get; init; }
    public string? Source { get; init; }
    public DateTime? ExpectedAcquisition { get; init; }
}
