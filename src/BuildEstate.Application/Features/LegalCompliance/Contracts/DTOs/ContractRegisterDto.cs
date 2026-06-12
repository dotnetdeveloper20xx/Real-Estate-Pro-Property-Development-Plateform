namespace BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;

/// <summary>
/// DTO for the contract register view (Requirement 14.3).
/// Displays contracts in a paginated data table with key identification,
/// status, value, and date columns alongside the linked case reference.
/// </summary>
public sealed record ContractRegisterDto
{
    public Guid Id { get; init; }
    public string ContractReference { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string ContractType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string CounterpartyName { get; init; } = string.Empty;
    public decimal ContractValue { get; init; }
    public string Currency { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public string? LegalCaseReference { get; init; }
}
