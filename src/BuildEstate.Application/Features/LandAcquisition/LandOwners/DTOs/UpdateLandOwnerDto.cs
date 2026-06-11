using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;

/// <summary>
/// Input data for updating an existing land owner.
/// </summary>
public sealed record UpdateLandOwnerDto
{
    public string Name { get; init; } = string.Empty;
    public string ContactDetails { get; init; } = string.Empty;
    public string? Address { get; init; }
    public OwnershipType OwnershipType { get; init; }
}
