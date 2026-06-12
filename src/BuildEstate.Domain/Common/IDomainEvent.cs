using MediatR;

namespace BuildEstate.Domain.Common;

/// <summary>
/// Marker interface for domain events.
/// Extends MediatR INotification to enable domain event dispatching via MediatR pipeline.
/// </summary>
public interface IDomainEvent : INotification
{
}
