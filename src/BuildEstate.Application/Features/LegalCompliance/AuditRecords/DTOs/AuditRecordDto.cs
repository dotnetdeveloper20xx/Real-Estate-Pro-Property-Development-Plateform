namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;

/// <summary>
/// Full response DTO for a created or retrieved audit record.
/// Contains all audit record fields including findings, recommendations, and linked entity references.
/// </summary>
public sealed record AuditRecordDto
{
    public Guid Id { get; init; }
    public string AuditType { get; init; } = string.Empty;
    public string Scope { get; init; } = string.Empty;
    public string AuditorName { get; init; } = string.Empty;
    public DateTime AuditDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Findings { get; init; }
    public string? RiskRating { get; init; }
    public string? Recommendations { get; init; }
    public DateTime? ActionDueDate { get; init; }
    public bool IsOverdue { get; init; }
    public Guid? LegalCaseId { get; init; }
    public Guid? ComplianceRequirementId { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? UpdatedAt { get; init; }
}
