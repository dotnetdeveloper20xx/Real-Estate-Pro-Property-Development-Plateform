using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;

/// <summary>
/// Contract DTO used within legal case detail views.
/// Provides contract summary information relevant to the parent case.
/// </summary>
public sealed record ContractDto
{
    public Guid Id { get; init; }
    public string ContractReference { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public LegalContractType ContractType { get; init; }
    public LegalContractStatus Status { get; init; }
    public string CounterpartyName { get; init; } = string.Empty;
    public decimal ContractValue { get; init; }
    public string Currency { get; init; } = "GBP";
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public DateTime? RenewalDate { get; init; }
    public DateTime CreatedAt { get; init; }
}
