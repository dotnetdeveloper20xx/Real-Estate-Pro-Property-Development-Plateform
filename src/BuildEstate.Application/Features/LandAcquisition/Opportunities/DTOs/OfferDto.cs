using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

public sealed record OfferDto(
    Guid Id,
    Guid OpportunityId,
    decimal Amount,
    string Currency,
    DateTime OfferDate,
    DateTime ValidUntil,
    OfferStatus Status,
    decimal? CounterOfferAmount,
    DateTime CreatedAt
);
