using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;

/// <summary>
/// Insurance record DTO used within legal case detail views.
/// Provides insurance policy information relevant to the parent case.
/// </summary>
public sealed record InsuranceRecordDto
{
    public Guid Id { get; init; }
    public string PolicyNumber { get; init; } = string.Empty;
    public string Insurer { get; init; } = string.Empty;
    public CoverageType CoverageType { get; init; }
    public decimal CoverAmount { get; init; }
    public decimal Premium { get; init; }
    public string Currency { get; init; } = "GBP";
    public DateTime StartDate { get; init; }
    public DateTime ExpiryDate { get; init; }
    public InsuranceStatus Status { get; init; }
}
