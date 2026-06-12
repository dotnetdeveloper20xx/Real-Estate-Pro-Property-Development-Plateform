using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;

/// <summary>
/// Summary DTO showing compliance status totals per category for dashboard and overview views.
/// </summary>
public sealed record ComplianceStatusSummaryDto
{
    public ComplianceCategory Category { get; init; }
    public int TotalRequirements { get; init; }
    public int CompliantCount { get; init; }
    public int NonCompliantCount { get; init; }
    public int OverdueCount { get; init; }
}
