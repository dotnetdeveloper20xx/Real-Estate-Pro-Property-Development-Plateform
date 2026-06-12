using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadLegalDocument;

/// <summary>
/// Command to upload a legal document linked to a case or contract.
/// Sets Version=1 and UploadedAt to current UTC time on creation.
/// </summary>
public sealed record UploadLegalDocumentCommand : IRequest<LegalDocumentDto>
{
    public Guid? LegalCaseId { get; init; }
    public Guid? ContractId { get; init; }
    public LegalDocumentType DocumentType { get; init; }
    public ConfidentialityLevel ConfidentialityLevel { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string StoragePath { get; init; } = string.Empty;
    public DateTime? RetentionExpiryDate { get; init; }
}
