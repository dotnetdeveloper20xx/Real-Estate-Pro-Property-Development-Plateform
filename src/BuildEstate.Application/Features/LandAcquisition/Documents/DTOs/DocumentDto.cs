namespace BuildEstate.Application.Features.LandAcquisition.Documents.DTOs;

/// <summary>
/// Data transfer object representing a document associated with a land opportunity.
/// </summary>
public sealed record DocumentDto(
    Guid Id,
    Guid OpportunityId,
    string DocType,
    string FileName,
    string FilePath,
    string ContentType,
    long FileSizeBytes,
    DateTime UploadedAt,
    DateTime CreatedAt,
    string CreatedBy);
