namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

/// <summary>
/// Lightweight opportunity DTO optimized for list views with minimal fields.
/// </summary>
public sealed record OpportunityListItemDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal LandSize { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Source { get; init; }
    public DateTime? ExpectedAcquisition { get; init; }
    public DateTime CreatedAt { get; init; }
}
