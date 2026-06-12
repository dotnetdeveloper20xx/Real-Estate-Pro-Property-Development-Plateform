using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;

/// <summary>
/// Standard insurance record DTO containing core fields for general use.
/// </summary>
public sealed record InsuranceRecordDto
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
}
