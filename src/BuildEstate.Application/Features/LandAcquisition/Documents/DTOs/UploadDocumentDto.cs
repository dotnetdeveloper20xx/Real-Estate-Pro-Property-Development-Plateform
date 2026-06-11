using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.DTOs;

/// <summary>
/// Data transfer object for uploading a document to a land opportunity.
/// Note: FileContent (Stream) is passed in the command, not in this DTO.
/// </summary>
public sealed record UploadDocumentDto(
    Guid OpportunityId,
    DocumentType DocType,
    string FileName,
    string ContentType,
    long FileSizeBytes);
