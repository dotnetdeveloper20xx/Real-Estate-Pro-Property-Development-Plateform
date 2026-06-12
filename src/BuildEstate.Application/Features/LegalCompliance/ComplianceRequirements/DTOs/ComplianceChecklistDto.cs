using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;

/// <summary>
/// Checklist view DTO for compliance requirements showing last check status, next due date, and a color-coded status indicator.
/// </summary>
public sealed record ComplianceChecklistDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public ComplianceCategory Category { get; init; }
    public ComplianceFrequency Frequency { get; init; }
    public DateTime? LastCheckDate { get; init; }
    public ComplianceCheckOutcome? LastOutcome { get; init; }
    public DateTime? NextDueDate { get; init; }

    /// <summary>
    /// Color-coded status indicator: "green" (compliant), "amber" (due soon), "red" (overdue/non-compliant), "grey" (no checks).
    /// </summary>
    public string StatusIndicator { get; init; } = string.Empty;

    public string ResponsibleRole { get; init; } = string.Empty;
}
