using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LegalCompliance;

/// <summary>
/// Represents a specific instance of verifying compliance against a ComplianceRequirement,
/// containing check date, outcome, evidence reference, findings, and reviewer identity.
/// </summary>
public class ComplianceCheck : BaseEntity
{
    public Guid ComplianceRequirementId { get; set; }
    public ComplianceRequirement ComplianceRequirement { get; set; } = null!;
    public DateTime CheckDate { get; set; }
    public ComplianceCheckOutcome Outcome { get; set; }
    public string Findings { get; set; } = string.Empty;
    public string? EvidenceReference { get; set; }
    public string? RemediationPlan { get; set; }
    public DateTime? RemediationDueDate { get; set; }
    public string ReviewerUserId { get; set; } = string.Empty;
    public string ReviewerName { get; set; } = string.Empty;
}
