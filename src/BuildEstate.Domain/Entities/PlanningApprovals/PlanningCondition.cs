using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;

namespace BuildEstate.Domain.Entities.PlanningApprovals;

public class PlanningCondition : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public int ConditionNumber { get; set; }
    public string Description { get; set; } = string.Empty;
    public ConditionType ConditionType { get; set; }
    public ConditionStatus Status { get; set; } = ConditionStatus.Outstanding;
    public DateTime? DischargeDate { get; set; }
    public string? DischargeReference { get; set; }
    public DateTime? DueDate { get; set; }

    // Navigation properties
    public PlanningApplication Application { get; set; } = null!;

    /// <summary>
    /// Raises an AllConditionsDischargedDomainEvent indicating that all conditions
    /// for the parent application have reached Discharged status.
    /// </summary>
    public void RaiseAllConditionsDischargedEvent(int totalConditions)
    {
        AddDomainEvent(new AllConditionsDischargedDomainEvent
        {
            ApplicationId = ApplicationId,
            TotalConditions = totalConditions,
            DischargedAt = DateTime.UtcNow
        });
    }
}
