using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.UpdateLandOwner;

/// <summary>
/// Command to update an existing land owner's details.
/// </summary>
public sealed record UpdateLandOwnerCommand : IRequest<LandOwnerDto>
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ContactDetails { get; init; } = string.Empty;
    public string? Address { get; init; }
    public OwnershipType OwnershipType { get; init; }
}
