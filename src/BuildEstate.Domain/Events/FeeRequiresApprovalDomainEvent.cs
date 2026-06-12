using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a planning fee exceeds the configured threshold,
/// requiring Finance Director approval before payment can proceed.
/// </summary>
public sealed record FeeRequiresApprovalDomainEvent : IDomainEvent
{
    public Guid FeeId { get; init; }
    public Guid ApplicationId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = string.Empty;
    public FeeType FeeType { get; init; }
}
