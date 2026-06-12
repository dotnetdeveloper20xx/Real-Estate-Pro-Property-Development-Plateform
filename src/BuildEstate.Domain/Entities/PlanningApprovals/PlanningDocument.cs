using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.PlanningApprovals;

public class PlanningDocument : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public PlanningDocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string UploadedBy { get; set; } = string.Empty;

    // Navigation properties
    public PlanningApplication Application { get; set; } = null!;
}
