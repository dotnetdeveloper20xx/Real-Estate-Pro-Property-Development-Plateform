using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a planning appeal is allowed, triggering
/// the parent application status update based on the outcome type.
/// </summary>
public sealed record AppealAllowedDomainEvent : IDomainEvent
{
    public Guid AppealId { get; init; }
    public Guid ApplicationId { get; init; }
    public AppealOutcomeType OutcomeType { get; init; }
    public DateTime DecisionDate { get; init; }
    public string DecisionSummary { get; init; } = string.Empty;
}
