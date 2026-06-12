using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a compliance check is recorded,
/// enabling notifications when non-compliant outcomes are detected.
/// </summary>
public sealed record ComplianceCheckRecordedEvent : IDomainEvent
{
    public Guid ComplianceCheckId { get; init; }
    public Guid ComplianceRequirementId { get; init; }
    public ComplianceCheckOutcome Outcome { get; init; }
    public DateTime CheckDate { get; init; }
    public string ReviewerUserId { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
}
