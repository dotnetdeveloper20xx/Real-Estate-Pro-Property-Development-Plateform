using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.DTOs;

/// <summary>
/// DTO representing a specific compliance check instance with outcome, findings, and reviewer details.
/// </summary>
public sealed record ComplianceCheckDto
{
    public Guid Id { get; init; }
    public Guid ComplianceRequirementId { get; init; }
    public DateTime CheckDate { get; init; }
    public ComplianceCheckOutcome Outcome { get; init; }
    public string Findings { get; init; } = string.Empty;
    public string? EvidenceReference { get; init; }
    public string? RemediationPlan { get; init; }
    public DateTime? RemediationDueDate { get; init; }
    public string ReviewerUserId { get; init; } = string.Empty;
    public string ReviewerName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
