using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LegalCompliance;

/// <summary>
/// Represents a file stored against a legal case or contract,
/// containing document type, version, file metadata, classification, confidentiality level, and retention period.
/// </summary>
public class LegalDocument : BaseEntity
{
    public LegalDocumentType DocumentType { get; set; }
    public ConfidentialityLevel ConfidentialityLevel { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public DateTime UploadedAt { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime? RetentionExpiryDate { get; set; }

    // Linked to either case or contract
    public Guid? LegalCaseId { get; set; }
    public LegalCase? LegalCase { get; set; }
    public Guid? ContractId { get; set; }
    public Contract? Contract { get; set; }
}
