namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

/// <summary>
/// Standard opportunity DTO containing core fields for general use.
/// </summary>
public sealed record OpportunityDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal LandSize { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Source { get; init; }
    public DateTime? ExpectedAcquisition { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
