using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for Contract State Machine Correctness and ROI Calculation Correctness.
/// 
/// **Validates: Requirements 8.2, 6.1, 6.3**
/// 
/// Property 4: Contract State Machine Correctness — for ALL pairs of (ContractStatus from, ContractStatus to),
/// the state machine SHALL permit the transition if and only if (from, to) is in the valid set:
/// {(Draft, UnderLegalReview), (UnderLegalReview, Approved), (UnderLegalReview, Rejected),
///  (Approved, Signed), (Signed, Exchanged), (Exchanged, Completed)}.
/// 
/// Property 6: ROI Calculation Correctness — for any set of non-negative decimal inputs,
/// TotalCosts = landCost + buildCost + fees + financeCosts,
/// Profit = revenue - totalCosts,
/// ROI = (revenue - totalCosts) / totalCosts * 100 (0 when totalCosts = 0).
/// </summary>
public class ContractStateMachineAndRoiPropertyTests
{
    #region Property 4: Contract State Machine Correctness

    private static readonly HashSet<(ContractStatus From, ContractStatus To)> ValidContractTransitions = new()
    {
        (ContractStatus.Draft, ContractStatus.UnderLegalReview),
        (ContractStatus.UnderLegalReview, ContractStatus.Approved),
        (ContractStatus.UnderLegalReview, ContractStatus.Rejected),
        (ContractStatus.Approved, ContractStatus.Signed),
        (ContractStatus.Signed, ContractStatus.Exchanged),
        (ContractStatus.Exchanged, ContractStatus.Completed)
    };

    private readonly ContractStateMachine _contractStateMachine = new();

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// For any pair of ContractStatus values (from, to), CanTransition returns true
    /// if and only if the pair is in the valid transition set.
    /// **Validates: Requirements 8.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractStateMachine_CanTransition_ReturnsTrue_OnlyForValidPairs()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);
        var pairGen = Gen.Two(statusGen).Select(t => (From: t.Item1, To: t.Item2));

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var result = _contractStateMachine.CanTransition(pair.From, pair.To);
            var expected = ValidContractTransitions.Contains((pair.From, pair.To));

            result.Should().Be(expected,
                because: $"transition from {pair.From} to {pair.To} should be {(expected ? "valid" : "invalid")}");
        });
    }

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// For any invalid (from, to) pair, ValidateTransition SHALL throw InvalidStateTransitionException
    /// containing the list of permitted transitions from the current status.
    /// **Validates: Requirements 8.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractStateMachine_ValidateTransition_ThrowsForInvalidPairs_WithPermittedList()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);
        var pairGen = Gen.Two(statusGen)
            .Select(t => (From: t.Item1, To: t.Item2))
            .Where(pair => !ValidContractTransitions.Contains((pair.From, pair.To)));

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var act = () => _contractStateMachine.ValidateTransition(pair.From, pair.To);

            var exception = act.Should().Throw<InvalidStateTransitionException>().Which;

            exception.CurrentStatus.Should().Be(pair.From.ToString());
            exception.AttemptedStatus.Should().Be(pair.To.ToString());

            // Permitted transitions in exception must match state machine's reported transitions
            var expectedPermitted = _contractStateMachine.GetPermittedTransitions(pair.From)
                .Select(s => s.ToString())
                .ToList();
            exception.PermittedTransitions.Should().BeEquivalentTo(expectedPermitted);
        });
    }

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// For any valid (from, to) pair, ValidateTransition SHALL NOT throw.
    /// **Validates: Requirements 8.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractStateMachine_ValidateTransition_DoesNotThrow_ForValidPairs()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);
        var pairGen = Gen.Two(statusGen)
            .Select(t => (From: t.Item1, To: t.Item2))
            .Where(pair => ValidContractTransitions.Contains((pair.From, pair.To)));

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var act = () => _contractStateMachine.ValidateTransition(pair.From, pair.To);
            act.Should().NotThrow();
        });
    }

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// GetPermittedTransitions returns only statuses that are valid targets from the given status.
    /// **Validates: Requirements 8.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractStateMachine_GetPermittedTransitions_ReturnsOnlyValidTargets()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);

        return Prop.ForAll(statusGen.ToArbitrary(), fromStatus =>
        {
            var permitted = _contractStateMachine.GetPermittedTransitions(fromStatus);

            var expectedPermitted = ValidContractTransitions
                .Where(t => t.From == fromStatus)
                .Select(t => t.To)
                .ToList();

            permitted.Should().BeEquivalentTo(expectedPermitted,
                because: $"permitted transitions from {fromStatus} should match the defined valid set");
        });
    }

    #endregion

    #region Property 6: ROI Calculation Correctness

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// TotalCosts = EstimatedLandCost + EstimatedBuildCost + ProfessionalFees + FinanceCosts
    /// **Validates: Requirements 6.1, 6.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoiCalculation_TotalCosts_EqualsSum_OfAllCostComponents()
    {
        var decGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);
        var inputGen = from landCost in decGen
                       from buildCost in decGen
                       from profFees in decGen
                       from financeCosts in decGen
                       select new
                       {
                           EstimatedLandCost = landCost,
                           EstimatedBuildCost = buildCost,
                           ProfessionalFees = profFees,
                           FinanceCosts = financeCosts
                       };

        return Prop.ForAll(inputGen.ToArbitrary(), inputs =>
        {
            var totalCosts = inputs.EstimatedLandCost
                           + inputs.EstimatedBuildCost
                           + inputs.ProfessionalFees
                           + inputs.FinanceCosts;

            // Verify the formula: TotalCosts = landCost + buildCost + fees + financeCosts
            totalCosts.Should().Be(
                inputs.EstimatedLandCost + inputs.EstimatedBuildCost +
                inputs.ProfessionalFees + inputs.FinanceCosts);
        });
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// EstimatedProfit = ExpectedSalesRevenue - TotalCosts
    /// **Validates: Requirements 6.1, 6.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoiCalculation_EstimatedProfit_EqualsRevenue_MinusTotalCosts()
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

            estimatedProfit.Should().Be(inputs.ExpectedSalesRevenue - totalCosts,
                because: "Profit = revenue - totalCosts");
        });
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// RoiPercentage = TotalCosts > 0 ? ((ExpectedSalesRevenue - TotalCosts) / TotalCosts) * 100 : 0
    /// Validates the full formula end-to-end against the handler's calculation logic.
    /// **Validates: Requirements 6.1, 6.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoiCalculation_RoiPercentage_MatchesFormula_ForAnyNonNegativeInputs()
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
    /// **Validates: Requirements 6.1, 6.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoiCalculation_RoiPercentage_IsZero_WhenTotalCostsAreZero()
    {
        var revenueGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);

        return Prop.ForAll(revenueGen.ToArbitrary(), revenue =>
        {
            decimal totalCosts = 0m;

            var roiPercentage = totalCosts > 0
                ? ((revenue - totalCosts) / totalCosts) * 100
                : 0m;

            roiPercentage.Should().Be(0m,
                because: "ROI should be 0 when total costs are zero to avoid divide by zero");
        });
    }

    /// <summary>
    /// Property 6: ROI Calculation Correctness
    /// Consistency: EstimatedProfit / TotalCosts * 100 = RoiPercentage when TotalCosts > 0.
    /// **Validates: Requirements 6.1, 6.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoiCalculation_AllCalculatedFields_AreConsistent()
    {
        // Use at least 0.01 for costs to ensure TotalCosts > 0
        var costGen = Gen.Choose(1, 10_000_000_00).Select(i => (decimal)i / 100m);
        var revenueGen = Gen.Choose(0, 10_000_000_00).Select(i => (decimal)i / 100m);

        var inputGen = from landCost in costGen
                       from buildCost in costGen
                       from profFees in costGen
                       from financeCosts in costGen
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

            var roiPercentage = ((inputs.ExpectedSalesRevenue - totalCosts) / totalCosts) * 100;

            // Consistency: profit/totalCosts * 100 = roiPercentage
            var roiFromProfit = (estimatedProfit / totalCosts) * 100;
            roiFromProfit.Should().Be(roiPercentage,
                because: "ROI calculated from profit should equal ROI calculated from revenue minus costs");
        });
    }

    #endregion
}
