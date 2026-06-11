namespace BuildEstate.Application.Features.LandAcquisition.Feasibility.DTOs;

/// <summary>
/// Data transfer object representing a feasibility assessment for a land opportunity.
/// Contains all cost inputs, calculated fields, scenario type, and review status.
/// </summary>
public sealed record FeasibilityAssessmentDto
{
    public Guid Id { get; init; }
    public Guid OpportunityId { get; init; }
    public decimal EstimatedLandCost { get; init; }
    public decimal EstimatedBuildCost { get; init; }
    public decimal ProfessionalFees { get; init; }
    public decimal FinanceCosts { get; init; }
    public decimal ExpectedSalesRevenue { get; init; }
    public decimal TotalCosts { get; init; }
    public decimal EstimatedProfit { get; init; }
    public decimal RoiPercentage { get; init; }
    public string Scenario { get; init; } = string.Empty;
    public bool IsReadyForReview { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
