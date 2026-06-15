using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

public sealed record DocumentDto(
    Guid Id,
    Guid OpportunityId,
    DocumentType DocType,
    string FileName,
    string FilePath,
    string ContentType,
    long FileSizeBytes,
    DateTime UploadedAt,
    DateTime CreatedAt
);
