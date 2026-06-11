using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a land opportunity successfully transitions to a new status.
/// </summary>
public sealed record OpportunityStatusTransitionedEvent : IDomainEvent
{
    public Guid OpportunityId { get; init; }
    public OpportunityStatus PreviousStatus { get; init; }
    public OpportunityStatus NewStatus { get; init; }
    public string TransitionedBy { get; init; } = string.Empty;
    public DateTime TransitionedAt { get; init; }
}
