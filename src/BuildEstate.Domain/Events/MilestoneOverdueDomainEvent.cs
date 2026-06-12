using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a planning milestone becomes overdue,
/// enabling notification to the responsible planning manager.
/// </summary>
public sealed record MilestoneOverdueDomainEvent : IDomainEvent
{
    public Guid MilestoneId { get; init; }
    public Guid ApplicationId { get; init; }
    public MilestoneType MilestoneType { get; init; }
    public DateTime TargetDate { get; init; }
}
