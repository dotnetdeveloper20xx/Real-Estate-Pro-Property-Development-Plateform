using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LegalCompliance;

/// <summary>
/// Represents a formal agreement between the company and a counterparty,
/// containing contract reference, title, type, status, parties, value, and key dates.
/// </summary>
public class Contract : BaseEntity
{
    public string ContractReference { get; set; } = string.Empty; // CON-YYYY-NNNNN
    public string Title { get; set; } = string.Empty;
    public LegalContractType ContractType { get; set; }
    public LegalContractStatus Status { get; set; } = LegalContractStatus.Draft;
    public string CounterpartyName { get; set; } = string.Empty;
    public decimal ContractValue { get; set; }
    public string Currency { get; set; } = "GBP";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? RenewalDate { get; set; }
    public string? TerminationClause { get; set; }
    public string? SpecialConditions { get; set; }
    public string? PaymentTerms { get; set; }
    public DateTime? ExecutionDate { get; set; }
    public string? SignatoryNames { get; set; }
    public string? TerminationReason { get; set; }
    public DateTime? TerminationDate { get; set; }
    public string? ApproverUserId { get; set; }
    public DateTime? ApprovalTimestamp { get; set; }
    public string? ApprovalNotes { get; set; }

    // FK
    public Guid LegalCaseId { get; set; }
    public LegalCase LegalCase { get; set; } = null!;

    // Navigation properties
    public ICollection<LegalDocument> Documents { get; set; } = new List<LegalDocument>();
}
