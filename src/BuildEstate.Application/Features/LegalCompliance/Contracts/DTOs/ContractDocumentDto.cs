namespace BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;

/// <summary>
/// Lightweight DTO representing a legal document associated with a contract.
/// Used within the ContractDetailDto to list attached documents.
/// </summary>
public sealed record ContractDocumentDto
{
    public Guid Id { get; init; }
    public string DocumentType { get; init; } = string.Empty;
    public string ConfidentialityLevel { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public int Version { get; init; }
    public DateTime UploadedAt { get; init; }
    public string UploadedBy { get; init; } = string.Empty;
}
