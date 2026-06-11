namespace BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;

/// <summary>
/// Data transfer object representing an offer associated with a land opportunity.
/// </summary>
public sealed record OfferDto(
    Guid Id,
    Guid OpportunityId,
    decimal Amount,
    string Currency,
    DateTime OfferDate,
    DateTime ValidUntil,
    string Status,
    decimal? CounterOfferAmount,
    Guid? OriginalOfferId,
    DateTime CreatedAt,
    string CreatedBy);
