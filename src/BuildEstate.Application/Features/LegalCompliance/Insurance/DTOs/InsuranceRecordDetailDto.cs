using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;

/// <summary>
/// Detailed insurance record DTO including permitted status transitions,
/// days until expiry, and linked legal case reference for the detail view.
/// </summary>
public sealed record InsuranceRecordDetailDto
{
    public Guid Id { get; init; }
    public string PolicyNumber { get; init; } = string.Empty;
    public string Insurer { get; init; } = string.Empty;
    public CoverageType CoverageType { get; init; }
    public decimal CoverAmount { get; init; }
    public decimal Premium { get; init; }
    public string Currency { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime ExpiryDate { get; init; }
    public InsuranceStatus Status { get; init; }
    public Guid? PreviousPolicyId { get; init; }
    public Guid? OpportunityId { get; init; }
    public Guid? LegalCaseId { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? UpdatedAt { get; init; }
    public List<InsuranceStatus> PermittedTransitions { get; init; } = new();
    public int DaysUntilExpiry { get; init; }
    public string? LegalCaseReference { get; init; }
}
