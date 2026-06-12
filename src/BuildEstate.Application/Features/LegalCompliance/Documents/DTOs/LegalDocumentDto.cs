using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;

/// <summary>
/// Canonical legal document DTO containing all document fields.
/// Used for create/update responses and document detail views.
/// </summary>
public sealed record LegalDocumentDto
{
    public Guid Id { get; init; }
    public LegalDocumentType DocumentType { get; init; }
    public ConfidentialityLevel ConfidentialityLevel { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string StoragePath { get; init; } = string.Empty;
    public int Version { get; init; }
    public DateTime UploadedAt { get; init; }
    public string UploadedBy { get; init; } = string.Empty;
    public DateTime? RetentionExpiryDate { get; init; }
    public Guid? LegalCaseId { get; init; }
    public Guid? ContractId { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
