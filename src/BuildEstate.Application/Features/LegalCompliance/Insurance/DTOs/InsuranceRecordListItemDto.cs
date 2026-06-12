using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;

/// <summary>
/// Lightweight insurance record DTO optimized for list views with minimal fields.
/// </summary>
public sealed record InsuranceRecordListItemDto
{
    public Guid Id { get; init; }
    public string PolicyNumber { get; init; } = string.Empty;
    public string Insurer { get; init; } = string.Empty;
    public CoverageType CoverageType { get; init; }
    public decimal CoverAmount { get; init; }
    public string Currency { get; init; } = string.Empty;
    public DateTime ExpiryDate { get; init; }
    public InsuranceStatus Status { get; init; }
    public int DaysUntilExpiry { get; init; }
}
