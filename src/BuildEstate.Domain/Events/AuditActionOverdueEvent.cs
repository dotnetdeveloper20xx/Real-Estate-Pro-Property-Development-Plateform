using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when an audit record action becomes overdue,
/// enabling notification to the Legal & Compliance Officer.
/// </summary>
public sealed record AuditActionOverdueEvent : IDomainEvent
{
    public Guid AuditRecordId { get; init; }
    public DateTime ActionDueDate { get; init; }
    public AuditType AuditType { get; init; }
    public string Scope { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
}
