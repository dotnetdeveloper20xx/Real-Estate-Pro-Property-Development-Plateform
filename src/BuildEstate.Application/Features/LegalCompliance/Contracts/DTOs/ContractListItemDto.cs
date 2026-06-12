namespace BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;

/// <summary>
/// Lightweight DTO for the contracts list/table view.
/// Contains the key fields needed for filtering, sorting, and quick identification.
/// </summary>
public sealed record ContractListItemDto
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
