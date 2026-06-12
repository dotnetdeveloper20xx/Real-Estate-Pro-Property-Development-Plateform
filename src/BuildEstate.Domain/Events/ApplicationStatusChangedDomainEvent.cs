using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a planning application status transitions,
/// enabling notifications and cross-module integration.
/// </summary>
public sealed record ApplicationStatusChangedDomainEvent : IDomainEvent
{
    public Guid ApplicationId { get; init; }
    public PlanningApplicationStatus PreviousStatus { get; init; }
    public PlanningApplicationStatus NewStatus { get; init; }
    public string ChangedBy { get; init; } = string.Empty;
    public DateTime ChangedAt { get; init; }
}
