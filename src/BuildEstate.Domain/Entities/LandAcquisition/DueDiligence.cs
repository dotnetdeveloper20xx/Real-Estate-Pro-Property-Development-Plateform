using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class DueDiligence : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public DueDiligenceType Type { get; set; }
    public DueDiligenceStatus Status { get; set; } = DueDiligenceStatus.Pending;
    public string? Findings { get; set; }
    public DateTime? ReportDate { get; set; }

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
}
