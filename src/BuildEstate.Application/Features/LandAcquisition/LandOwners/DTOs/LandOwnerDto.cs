namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;

/// <summary>
/// Represents a land owner record in API responses.
/// </summary>
public sealed record LandOwnerDto
{
    public Guid Id { get; init; }
    public Guid OpportunityId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ContactDetails { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string OwnershipType { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
