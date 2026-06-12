using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;

/// <summary>
/// Rich detail DTO for a single audit record retrieved by Id.
/// Extends the base audit record data with permitted status transitions,
/// days until action due, and linked entity names for display.
/// </summary>
public sealed record AuditRecordDetailDto
{
    // Core audit record fields
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

    // State machine permitted transitions
    public IReadOnlyList<AuditRecordStatus> PermittedTransitions { get; init; } = [];

    // Computed fields
    public int? DaysUntilActionDue { get; init; }

    // Linked entity display names
    public string? LegalCaseReference { get; init; }
    public string? ComplianceRequirementName { get; init; }
}
