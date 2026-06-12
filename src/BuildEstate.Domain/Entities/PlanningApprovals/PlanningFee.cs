using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;

namespace BuildEstate.Domain.Entities.PlanningApprovals;

public class PlanningFee : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public FeeType FeeType { get; set; }
    public string Description { get; set; } = string.Empty;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovalNotes { get; set; }

    // Navigation properties
    public PlanningApplication Application { get; set; } = null!;

    /// <summary>
    /// Raises a FeeRequiresApprovalDomainEvent indicating that the fee amount
    /// exceeds the configured threshold and requires Finance Director approval.
    /// </summary>
    public void RaiseFeeRequiresApprovalEvent()
    {
        AddDomainEvent(new FeeRequiresApprovalDomainEvent
        {
            FeeId = Id,
            ApplicationId = ApplicationId,
            Amount = Amount,
            Currency = Currency,
            FeeType = FeeType
        });
    }
}
