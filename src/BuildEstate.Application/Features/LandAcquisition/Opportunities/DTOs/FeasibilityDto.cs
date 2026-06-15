using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

public sealed record FeasibilityDto(
    Guid Id,
    Guid OpportunityId,
    decimal EstimatedLandCost,
    decimal EstimatedBuildCost,
    decimal ProfessionalFees,
    decimal FinanceCosts,
    decimal ExpectedSalesRevenue,
    decimal TotalCosts,
    decimal EstimatedProfit,
    decimal RoiPercentage,
    FeasibilityScenario Scenario,
    bool IsReadyForReview,
    DateTime CreatedAt
);
