namespace BuildEstate.Domain.Common;

/// <summary>
/// Interface exposing a read-only collection of domain events.
/// </summary>
public interface IHasDomainEvents
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    void ClearDomainEvents();
}
