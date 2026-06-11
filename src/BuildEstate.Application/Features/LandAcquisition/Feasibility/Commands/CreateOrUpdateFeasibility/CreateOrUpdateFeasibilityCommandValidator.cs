using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Feasibility.Commands.CreateOrUpdateFeasibility;

/// <summary>
/// Validates the CreateOrUpdateFeasibilityCommand input fields.
/// All decimal fields must be non-negative, OpportunityId must be provided,
/// and Scenario must be a valid enum value.
/// </summary>
public sealed class CreateOrUpdateFeasibilityCommandValidator
    : AbstractValidator<CreateOrUpdateFeasibilityCommand>
{
    public CreateOrUpdateFeasibilityCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("Opportunity ID is required.");

        RuleFor(x => x.EstimatedLandCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Estimated land cost must be zero or a positive value.");

        RuleFor(x => x.EstimatedBuildCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Estimated build cost must be zero or a positive value.");

        RuleFor(x => x.ProfessionalFees)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Professional fees must be zero or a positive value.");

        RuleFor(x => x.FinanceCosts)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Finance costs must be zero or a positive value.");

        RuleFor(x => x.ExpectedSalesRevenue)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Expected sales revenue must be zero or a positive value.");

        RuleFor(x => x.Scenario)
            .IsInEnum()
            .WithMessage("Scenario must be a valid value (BestCase, Expected, or WorstCase).");
    }
}
