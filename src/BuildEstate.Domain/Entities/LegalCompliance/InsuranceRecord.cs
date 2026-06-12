using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LegalCompliance;

/// <summary>
/// Represents an insurance policy held by the company,
/// containing policy number, insurer, coverage type, cover amount, premium, dates, and renewal linkage.
/// </summary>
public class InsuranceRecord : BaseEntity
{
    public string PolicyNumber { get; set; } = string.Empty;
    public string Insurer { get; set; } = string.Empty;
    public CoverageType CoverageType { get; set; }
    public decimal CoverAmount { get; set; }
    public decimal Premium { get; set; }
    public string Currency { get; set; } = "GBP";
    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public InsuranceStatus Status { get; set; } = InsuranceStatus.Active;
    public Guid? PreviousPolicyId { get; set; }

    // Optional links
    public Guid? OpportunityId { get; set; }
    public Guid? LegalCaseId { get; set; }
    public LegalCase? LegalCase { get; set; }
}
