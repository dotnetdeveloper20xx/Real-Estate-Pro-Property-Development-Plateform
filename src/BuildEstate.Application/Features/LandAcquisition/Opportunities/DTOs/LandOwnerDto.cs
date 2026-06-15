using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

public sealed record LandOwnerDto(
    Guid Id,
    Guid OpportunityId,
    string Name,
    string ContactDetails,
    string? Address,
    OwnershipType OwnershipType
);
