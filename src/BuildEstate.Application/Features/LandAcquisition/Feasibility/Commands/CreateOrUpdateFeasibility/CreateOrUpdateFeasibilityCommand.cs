using BuildEstate.Application.Features.LandAcquisition.Feasibility.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Feasibility.Commands.CreateOrUpdateFeasibility;

/// <summary>
/// Command to create or update a feasibility assessment for a land opportunity.
/// If an assessment already exists for the given OpportunityId, it will be updated;
/// otherwise a new assessment is created. Calculates TotalCosts, EstimatedProfit, and RoiPercentage.
/// </summary>
public sealed record CreateOrUpdateFeasibilityCommand : IRequest<FeasibilityAssessmentDto>
{
    public Guid OpportunityId { get; init; }
    public decimal EstimatedLandCost { get; init; }
    public decimal EstimatedBuildCost { get; init; }
    public decimal ProfessionalFees { get; init; }
    public decimal FinanceCosts { get; init; }
    public decimal ExpectedSalesRevenue { get; init; }
    public FeasibilityScenario Scenario { get; init; }
    public bool IsReadyForReview { get; init; }
}
