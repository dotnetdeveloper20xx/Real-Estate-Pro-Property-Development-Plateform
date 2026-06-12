using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LegalCompliance;

/// <summary>
/// Represents a regulatory or policy obligation that the company must meet,
/// containing requirement name, category, source regulation, description, frequency, and responsible role.
/// </summary>
public class ComplianceRequirement : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ComplianceCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public string SourceRegulation { get; set; } = string.Empty;
    public ComplianceFrequency Frequency { get; set; }
    public string ResponsibleRole { get; set; } = string.Empty;
    public ComplianceRequirementStatus Status { get; set; } = ComplianceRequirementStatus.Active;
    public string? RetirementReason { get; set; }
    public DateTime? NextDueDate { get; set; }

    // Navigation properties
    public ICollection<ComplianceCheck> Checks { get; set; } = new List<ComplianceCheck>();
}
