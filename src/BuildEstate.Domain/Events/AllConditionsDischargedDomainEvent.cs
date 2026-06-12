using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when all planning conditions for an application
/// reach Discharged status, indicating all obligations are fulfilled.
/// </summary>
public sealed record AllConditionsDischargedDomainEvent : IDomainEvent
{
    public Guid ApplicationId { get; init; }
    public int TotalConditions { get; init; }
    public DateTime DischargedAt { get; init; }
}
