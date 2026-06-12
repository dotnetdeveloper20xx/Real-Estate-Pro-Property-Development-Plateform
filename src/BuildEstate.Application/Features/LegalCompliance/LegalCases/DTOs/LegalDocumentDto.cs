using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;

/// <summary>
/// Legal document DTO used within legal case detail views.
/// Provides document metadata relevant to the parent case.
/// </summary>
public sealed record LegalDocumentDto
{
    public Guid Id { get; init; }
    public LegalDocumentType DocumentType { get; init; }
    public ConfidentialityLevel ConfidentialityLevel { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public int Version { get; init; }
    public DateTime UploadedAt { get; init; }
    public string UploadedBy { get; init; } = string.Empty;
    public DateTime? RetentionExpiryDate { get; init; }
}
