namespace BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;

/// <summary>
/// Full response DTO for a created or retrieved contract.
/// Contains all contract fields including lifecycle dates, approval, and termination data.
/// </summary>
public sealed record ContractDto
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
    public DateTime? RenewalDate { get; init; }
    public string? TerminationClause { get; init; }
    public string? SpecialConditions { get; init; }
    public string? PaymentTerms { get; init; }
    public DateTime? ExecutionDate { get; init; }
    public string? SignatoryNames { get; init; }
    public string? TerminationReason { get; init; }
    public DateTime? TerminationDate { get; init; }
    public string? ApproverUserId { get; init; }
    public DateTime? ApprovalTimestamp { get; init; }
    public string? ApprovalNotes { get; init; }
    public Guid LegalCaseId { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? UpdatedAt { get; init; }
}
