using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LegalCompliance;

/// <summary>
/// Represents an internal or external audit event within the legal module,
/// containing audit type, scope, findings, recommendations, auditor, and completion tracking.
/// </summary>
public class AuditRecord : BaseEntity
{
    public AuditType AuditType { get; set; }
    public string Scope { get; set; } = string.Empty;
    public string AuditorName { get; set; } = string.Empty;
    public DateTime AuditDate { get; set; }
    public AuditRecordStatus Status { get; set; } = AuditRecordStatus.Planned;
    public string? Findings { get; set; }
    public RiskRating? RiskRating { get; set; }
    public string? Recommendations { get; set; }
    public DateTime? ActionDueDate { get; set; }
    public bool IsOverdue { get; set; }

    // Optional links
    public Guid? LegalCaseId { get; set; }
    public Guid? ComplianceRequirementId { get; set; }
}
