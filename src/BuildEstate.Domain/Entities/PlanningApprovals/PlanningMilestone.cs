using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;

namespace BuildEstate.Domain.Entities.PlanningApprovals;

public class PlanningMilestone : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public MilestoneType MilestoneType { get; set; }
    public MilestoneStatus Status { get; set; } = MilestoneStatus.Pending;
    public DateTime TargetDate { get; set; }
    public DateTime? ActualDate { get; set; }
    public int? VarianceDays { get; set; }

    // Navigation properties
    public PlanningApplication Application { get; set; } = null!;

    /// <summary>
    /// Marks this milestone as overdue and raises the MilestoneOverdueDomainEvent
    /// to notify the responsible planning manager.
    /// </summary>
    public void MarkAsOverdue()
    {
        Status = MilestoneStatus.Overdue;
        AddDomainEvent(new MilestoneOverdueDomainEvent
        {
            MilestoneId = Id,
            ApplicationId = ApplicationId,
            MilestoneType = MilestoneType,
            TargetDate = TargetDate
        });
    }
}
