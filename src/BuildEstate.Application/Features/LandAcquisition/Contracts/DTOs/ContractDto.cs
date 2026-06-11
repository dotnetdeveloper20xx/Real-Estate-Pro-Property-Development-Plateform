namespace BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs;

/// <summary>
/// Data transfer object representing a contract associated with a land opportunity.
/// </summary>
public sealed record ContractDto(
    Guid Id,
    Guid OpportunityId,
    string Status,
    string? SolicitorName,
    string? SolicitorFirm,
    string? SolicitorContact,
    decimal? DepositAmount,
    DateTime CreatedAt,
    string CreatedBy);
