using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LegalCompliance;

/// <summary>
/// Represents a legal matter associated with a land opportunity or planning application.
/// Contains case reference, description, type, status, priority, and assigned solicitor details.
/// </summary>
public class LegalCase : BaseEntity
{
    public string CaseReference { get; set; } = string.Empty; // LC-YYYY-NNNNN
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LegalCaseType CaseType { get; set; }
    public LegalCaseStatus Status { get; set; } = LegalCaseStatus.Open;
    public LegalCasePriority Priority { get; set; }
    public string? AssignedSolicitor { get; set; }
    public string? SolicitorFirm { get; set; }
    public string? SolicitorEmail { get; set; }
    public string? SolicitorPhone { get; set; }
    public string? Notes { get; set; }
    public string? ResolutionSummary { get; set; }
    public DateTime? ResolutionDate { get; set; }
    public string? EscalationReason { get; set; }
    public string? HoldReason { get; set; }

    // Integration FKs
    public Guid? OpportunityId { get; set; }
    public Guid? PlanningApplicationId { get; set; }

    // Navigation properties
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<LegalDocument> Documents { get; set; } = new List<LegalDocument>();
    public ICollection<InsuranceRecord> InsuranceRecords { get; set; } = new List<InsuranceRecord>();
}
