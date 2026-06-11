using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class ApprovalRequest : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
    public string? ApproverUserId { get; set; }
    public DateTime? ApprovalTimestamp { get; set; }
    public string? ApprovalNotes { get; set; }
    public string? RejectionReason { get; set; }
    public decimal RequestedAmount { get; set; }

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
}
