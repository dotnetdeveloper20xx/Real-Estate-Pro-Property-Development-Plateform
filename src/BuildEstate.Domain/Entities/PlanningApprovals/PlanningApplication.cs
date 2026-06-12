using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;

namespace BuildEstate.Domain.Entities.PlanningApprovals;

public class PlanningApplication : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public PlanningApplicationType ApplicationType { get; set; }
    public PlanningApplicationStatus Status { get; set; } = PlanningApplicationStatus.PreApplication;
    public string? ApplicationReference { get; set; }
    public string CouncilName { get; set; } = string.Empty;
    public DateTime? SubmissionDate { get; set; }
    public DateTime? TargetDecisionDate { get; set; }
    public DateTime? ActualDecisionDate { get; set; }
    public DateTime? DecisionDate { get; set; }
    public string? WithdrawalReason { get; set; }

    // Navigation properties
    public CouncilContact? CouncilContact { get; set; }
    public ICollection<PlanningCondition> Conditions { get; set; } = new List<PlanningCondition>();
    public ICollection<PlanningAppeal> Appeals { get; set; } = new List<PlanningAppeal>();
    public ICollection<PlanningDocument> Documents { get; set; } = new List<PlanningDocument>();
    public ICollection<PlanningFee> Fees { get; set; } = new List<PlanningFee>();
    public ICollection<PlanningMilestone> Milestones { get; set; } = new List<PlanningMilestone>();

    /// <summary>
    /// Raises an ApplicationStatusChangedDomainEvent to notify subscribers
    /// that the application has transitioned to a new status.
    /// </summary>
    public void RaiseStatusChangedEvent(
        PlanningApplicationStatus previousStatus,
        PlanningApplicationStatus newStatus,
        string changedBy,
        DateTime changedAt)
    {
        AddDomainEvent(new ApplicationStatusChangedDomainEvent
        {
            ApplicationId = Id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            ChangedBy = changedBy,
            ChangedAt = changedAt
        });
    }
}
