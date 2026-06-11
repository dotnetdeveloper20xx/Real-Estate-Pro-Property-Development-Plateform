using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class FeasibilityAssessment : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public decimal EstimatedLandCost { get; set; }
    public decimal EstimatedBuildCost { get; set; }
    public decimal ProfessionalFees { get; set; }
    public decimal FinanceCosts { get; set; }
    public decimal ExpectedSalesRevenue { get; set; }
    public decimal TotalCosts { get; set; }
    public decimal EstimatedProfit { get; set; }
    public decimal RoiPercentage { get; set; }
    public FeasibilityScenario Scenario { get; set; }
    public bool IsReadyForReview { get; set; } = false;

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
}
