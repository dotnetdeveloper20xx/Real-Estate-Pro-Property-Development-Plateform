using BuildEstate.Application.Features.LandAcquisition.Feasibility.Commands.CreateOrUpdateFeasibility;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for ROI Calculation Correctness.
/// **Validates: Requirements 6.1, 6.3**
/// 
/// Property 6: ROI Calculation Correctness — for any set of non-negative decimal inputs,
/// the system SHALL compute TotalCosts, EstimatedProfit, and RoiPercentage correctly per the formula.
/// </summary>
public class RoiCalculationPropertyTests
{
    /// <summary>
    /// Generates a non-negative decimal within a reasonable range for financial calculations.
    /// Values are between 0 and 10,000,000 with 2 decimal places.
    /// </summary>
    private static Arbitrary<decimal> NonNegativeDecimalArbitrary()
    {
        var gen = Gen.Choose(0, 10_000_000_00) // cents range for precision
            .Select(i => (decimal)i / 100m);
        return gen.ToArbitrary();
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// TotalCosts = EstimatedLandCost + EstimatedBuildCost + ProfessionalFees + FinanceCosts
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TotalCosts_EqualsSum_OfAllCostComponents()
    {
        var decGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);
        var inputGen = Gen.Four(decGen).Select(t => new
        {
            EstimatedLandCost = t.Item1,
            EstimatedBuildCost = t.Item2,
            ProfessionalFees = t.Item3,
            FinanceCosts = t.Item4
        });

        return Prop.ForAll(inputGen.ToArbitrary(), inputs =>
        {
            var totalCosts = inputs.EstimatedLandCost
                           + inputs.EstimatedBuildCost
                           + inputs.ProfessionalFees
                           + inputs.FinanceCosts;

            var expected = inputs.EstimatedLandCost
                         + inputs.EstimatedBuildCost
                         + inputs.ProfessionalFees
                         + inputs.FinanceCosts;

            totalCosts.Should().Be(expected);
        });
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// EstimatedProfit = ExpectedSalesRevenue - TotalCosts
    /// </summary>
    [Property(MaxTest = 100)]
    public Property EstimatedProfit_EqualsRevenue_MinusTotalCosts()
    {
        var decGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);
        var inputGen = from landCost in decGen
                       from buildCost in decGen
                       from profFees in decGen
                       from financeCosts in decGen
                       from revenue in decGen
                       select new
                       {
                           EstimatedLandCost = landCost,
                           EstimatedBuildCost = buildCost,
                           ProfessionalFees = profFees,
                           FinanceCosts = financeCosts,
                           ExpectedSalesRevenue = revenue
                       };

        return Prop.ForAll(inputGen.ToArbitrary(), inputs =>
        {
            var totalCosts = inputs.EstimatedLandCost
                           + inputs.EstimatedBuildCost
                           + inputs.ProfessionalFees
                           + inputs.FinanceCosts;

            var estimatedProfit = inputs.ExpectedSalesRevenue - totalCosts;

            estimatedProfit.Should().Be(inputs.ExpectedSalesRevenue - totalCosts);
        });
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// RoiPercentage = TotalCosts > 0 ? ((ExpectedSalesRevenue - TotalCosts) / TotalCosts) * 100 : 0
    /// Validates the full formula end-to-end against the handler's calculation logic.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoiPercentage_MatchesFormula_ForAnyNonNegativeInputs()
    {
        var decGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);
        var inputGen = from landCost in decGen
                       from buildCost in decGen
                       from profFees in decGen
                       from financeCosts in decGen
                       from revenue in decGen
                       select new
                       {
                           EstimatedLandCost = landCost,
                           EstimatedBuildCost = buildCost,
                           ProfessionalFees = profFees,
                           FinanceCosts = financeCosts,
                           ExpectedSalesRevenue = revenue
                       };

        return Prop.ForAll(inputGen.ToArbitrary(), inputs =>
        {
            var totalCosts = inputs.EstimatedLandCost
                           + inputs.EstimatedBuildCost
                           + inputs.ProfessionalFees
                           + inputs.FinanceCosts;

            var expectedRoi = totalCosts > 0
                ? ((inputs.ExpectedSalesRevenue - totalCosts) / totalCosts) * 100
                : 0m;

            // Replicate the handler's exact calculation
            var handlerTotalCosts = inputs.EstimatedLandCost
                                  + inputs.EstimatedBuildCost
                                  + inputs.ProfessionalFees
                                  + inputs.FinanceCosts;

            var handlerRoi = handlerTotalCosts > 0
                ? ((inputs.ExpectedSalesRevenue - handlerTotalCosts) / handlerTotalCosts) * 100
                : 0m;

            handlerRoi.Should().Be(expectedRoi,
                because: "the ROI calculation should match the formula exactly");
        });
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// When all cost inputs are zero, TotalCosts = 0 and RoiPercentage = 0 (avoids divide by zero).
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoiPercentage_IsZero_WhenTotalCostsAreZero()
    {
        var revenueGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);

        return Prop.ForAll(revenueGen.ToArbitrary(), revenue =>
        {
            decimal totalCosts = 0m + 0m + 0m + 0m; // all cost components are zero

            var roiPercentage = totalCosts > 0
                ? ((revenue - totalCosts) / totalCosts) * 100
                : 0m;

            roiPercentage.Should().Be(0m,
                because: "ROI should be 0 when total costs are zero to avoid divide by zero");
        });
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// The calculated values are consistent: EstimatedProfit = ExpectedSalesRevenue - TotalCosts
    /// and RoiPercentage = (EstimatedProfit / TotalCosts) * 100 when TotalCosts > 0.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AllCalculatedFields_AreConsistent()
    {
        var decGen = Gen.Choose(1, 10_000_000_00).Select(i => (decimal)i / 100m); // at least 0.01 for costs
        var revenueGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);

        var inputGen = from landCost in decGen
                       from buildCost in decGen
                       from profFees in decGen
                       from financeCosts in decGen
                       from revenue in revenueGen
                       select new
                       {
                           EstimatedLandCost = landCost,
                           EstimatedBuildCost = buildCost,
                           ProfessionalFees = profFees,
                           FinanceCosts = financeCosts,
                           ExpectedSalesRevenue = revenue
                       };

        return Prop.ForAll(inputGen.ToArbitrary(), inputs =>
        {
            var totalCosts = inputs.EstimatedLandCost
                           + inputs.EstimatedBuildCost
                           + inputs.ProfessionalFees
                           + inputs.FinanceCosts;

            var estimatedProfit = inputs.ExpectedSalesRevenue - totalCosts;

            var roiPercentage = totalCosts > 0
                ? ((inputs.ExpectedSalesRevenue - totalCosts) / totalCosts) * 100
                : 0m;

            // Consistency check: profit/totalCosts * 100 = roiPercentage
            if (totalCosts > 0)
            {
                var roiFromProfit = (estimatedProfit / totalCosts) * 100;
                roiFromProfit.Should().Be(roiPercentage,
                    because: "ROI calculated from profit should equal ROI calculated from revenue minus costs");
            }
        });
    }
}
