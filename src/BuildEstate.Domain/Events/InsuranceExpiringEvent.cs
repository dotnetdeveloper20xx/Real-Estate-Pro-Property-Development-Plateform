using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when an insurance record is approaching expiry or has expired,
/// enabling proactive notifications to the Legal & Compliance Officer.
/// </summary>
public sealed record InsuranceExpiringEvent : IDomainEvent
{
    public Guid InsuranceRecordId { get; init; }
    public string PolicyNumber { get; init; } = string.Empty;
    public DateTime ExpiryDate { get; init; }
    public InsuranceStatus InsuranceStatus { get; init; }
    public DateTime Timestamp { get; init; }
}
