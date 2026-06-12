using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a legal case status transitions,
/// enabling notifications to stakeholders and cross-module integration.
/// </summary>
public sealed record LegalCaseStatusChangedEvent : IDomainEvent
{
    public Guid LegalCaseId { get; init; }
    public string CaseReference { get; init; } = string.Empty;
    public LegalCaseStatus PreviousStatus { get; init; }
    public LegalCaseStatus NewStatus { get; init; }
    public string? TransitionReason { get; init; }
    public string UserId { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
}
