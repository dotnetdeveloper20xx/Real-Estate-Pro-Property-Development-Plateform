using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Commands.CreateComplianceCheck;

/// <summary>
/// Command to record a new compliance check against an active ComplianceRequirement.
/// Captures outcome, findings, evidence, and optional remediation details for non-compliant results.
/// </summary>
public sealed record CreateComplianceCheckCommand : IRequest<ComplianceCheckDto>
{
    public Guid ComplianceRequirementId { get; init; }
    public DateTime CheckDate { get; init; }
    public ComplianceCheckOutcome Outcome { get; init; }
    public string Findings { get; init; } = string.Empty;
    public string? EvidenceReference { get; init; }
    public string? RemediationPlan { get; init; }
    public DateTime? RemediationDueDate { get; init; }
}
