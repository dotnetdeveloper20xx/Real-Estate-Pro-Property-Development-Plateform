using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class Document : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public DocumentType DocType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
}
