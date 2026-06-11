namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.DTOs;

/// <summary>
/// Data transfer object representing a land acquisition record.
/// </summary>
public sealed record AcquisitionDto(
    Guid Id,
    Guid OpportunityId,
    decimal PurchasePrice,
    DateTime CompletionDate,
    string RegistryRef,
    string Status,
    DateTime CreatedAt,
    string CreatedBy);
