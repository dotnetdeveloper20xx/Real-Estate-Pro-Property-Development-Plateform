using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.CreateLandOwner;

/// <summary>
/// Command to create a new land owner associated with a land opportunity.
/// </summary>
public sealed record CreateLandOwnerCommand : IRequest<LandOwnerDto>
{
    public Guid OpportunityId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ContactDetails { get; init; } = string.Empty;
    public string? Address { get; init; }
    public OwnershipType OwnershipType { get; init; }
}
