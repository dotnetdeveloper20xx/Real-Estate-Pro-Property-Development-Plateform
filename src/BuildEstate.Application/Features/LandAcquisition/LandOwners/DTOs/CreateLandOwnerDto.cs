using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;

/// <summary>
/// Input data for creating a new land owner.
/// </summary>
public sealed record CreateLandOwnerDto
{
    public Guid OpportunityId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ContactDetails { get; init; } = string.Empty;
    public string? Address { get; init; }
    public OwnershipType OwnershipType { get; init; }
}
