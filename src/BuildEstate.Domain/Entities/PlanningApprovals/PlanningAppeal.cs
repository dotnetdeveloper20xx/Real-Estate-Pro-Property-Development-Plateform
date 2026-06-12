using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;

namespace BuildEstate.Domain.Entities.PlanningApprovals;

public class PlanningAppeal : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public string AppealGrounds { get; set; } = string.Empty;
    public AppealType AppealType { get; set; }
    public AppealStatus Status { get; set; } = AppealStatus.Lodged;
    public AppealOutcomeType? AppealOutcomeType { get; set; }
    public DateTime LodgedDate { get; set; }
    public DateTime? DecisionDate { get; set; }
    public string? DecisionSummary { get; set; }

    // Navigation properties
    public PlanningApplication Application { get; set; } = null!;

    /// <summary>
    /// Raises an AppealAllowedDomainEvent indicating that this appeal was allowed,
    /// triggering the parent application status update based on the outcome type.
    /// </summary>
    public void RaiseAppealAllowedEvent(AppealOutcomeType outcomeType, DateTime decisionDate, string decisionSummary)
    {
        AddDomainEvent(new AppealAllowedDomainEvent
        {
            AppealId = Id,
            ApplicationId = ApplicationId,
            OutcomeType = outcomeType,
            DecisionDate = decisionDate,
            DecisionSummary = decisionSummary
        });
    }
}
