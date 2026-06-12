using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Events;

/// <summary>
/// Domain event raised when a contract status transitions,
/// enabling notifications to the Legal & Compliance Officer and Acquisition Manager.
/// </summary>
public sealed record ContractStatusChangedEvent : IDomainEvent
{
    public Guid ContractId { get; init; }
    public string ContractReference { get; init; } = string.Empty;
    public LegalContractStatus PreviousStatus { get; init; }
    public LegalContractStatus NewStatus { get; init; }
    public string UserId { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
}
