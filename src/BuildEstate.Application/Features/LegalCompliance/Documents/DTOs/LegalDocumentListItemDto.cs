using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;

/// <summary>
/// Lightweight legal document DTO optimized for list views.
/// Excludes storage path and parent entity IDs for minimal payload.
/// </summary>
public sealed record LegalDocumentListItemDto
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
}
