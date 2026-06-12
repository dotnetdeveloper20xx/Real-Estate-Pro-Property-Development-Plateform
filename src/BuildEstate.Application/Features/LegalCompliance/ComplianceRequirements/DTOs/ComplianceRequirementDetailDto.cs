using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.DTOs;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;

/// <summary>
/// Detailed compliance requirement DTO extending the base with recent checks, last outcome, and total check count.
/// </summary>
public sealed record ComplianceRequirementDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public ComplianceCategory Category { get; init; }
    public string Description { get; init; } = string.Empty;
    public string SourceRegulation { get; init; } = string.Empty;
    public ComplianceFrequency Frequency { get; init; }
    public string ResponsibleRole { get; init; } = string.Empty;
    public ComplianceRequirementStatus Status { get; init; }
    public string? RetirementReason { get; init; }
    public DateTime? NextDueDate { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public List<ComplianceCheckDto> RecentChecks { get; init; } = new();
    public ComplianceCheckOutcome? LastCheckOutcome { get; init; }
    public int TotalChecksCount { get; init; }
}
