using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for <see cref="PlanningStatusStateMachine"/> and <see cref="ConditionStatusStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible status pairs.
///
/// **Validates: Requirements 2.1, 2.2, 5.4**
/// </summary>
public class PlanningStateMachinePropertyTests
{
    private readonly PlanningStatusStateMachine _planningStateMachine = new();
    private readonly ConditionStatusStateMachine _conditionStateMachine = new();

    #region Planning Status State Machine — Property 1

    /// <summary>
    /// The complete set of valid PlanningApplicationStatus transitions as defined in the design document.
    /// </summary>
    private static readonly HashSet<(PlanningApplicationStatus From, PlanningApplicationStatus To)> ValidPlanningTransitions = new()
    {
        (PlanningApplicationStatus.PreApplication, PlanningApplicationStatus.Submitted),
        (PlanningApplicationStatus.Submitted, PlanningApplicationStatus.Validated),
        (PlanningApplicationStatus.Submitted, PlanningApplicationStatus.Withdrawn),
        (PlanningApplicationStatus.Validated, PlanningApplicationStatus.UnderReview),
        (PlanningApplicationStatus.Validated, PlanningApplicationStatus.Withdrawn),
        (PlanningApplicationStatus.UnderReview, PlanningApplicationStatus.CommitteeReview),
        (PlanningApplicationStatus.UnderReview, PlanningApplicationStatus.Approved),
        (PlanningApplicationStatus.UnderReview, PlanningApplicationStatus.ApprovedWithConditions),
        (PlanningApplicationStatus.UnderReview, PlanningApplicationStatus.Refused),
        (PlanningApplicationStatus.UnderReview, PlanningApplicationStatus.Withdrawn),
        (PlanningApplicationStatus.CommitteeReview, PlanningApplicationStatus.Approved),
        (PlanningApplicationStatus.CommitteeReview, PlanningApplicationStatus.ApprovedWithConditions),
        (PlanningApplicationStatus.CommitteeReview, PlanningApplicationStatus.Refused),
        (PlanningApplicationStatus.CommitteeReview, PlanningApplicationStatus.Withdrawn),
        (PlanningApplicationStatus.Refused, PlanningApplicationStatus.Appeal),
        (PlanningApplicationStatus.Appeal, PlanningApplicationStatus.Approved),
        (PlanningApplicationStatus.Appeal, PlanningApplicationStatus.ApprovedWithConditions),
        (PlanningApplicationStatus.Appeal, PlanningApplicationStatus.Refused)
    };

    /// <summary>
    /// Property 1: Application State Machine Validity — CanTransition returns true
    /// ONLY for valid transitions defined in the design specification.
    ///
    /// For any pair of PlanningApplicationStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Planning_CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<PlanningApplicationStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            Gen.Elements(allStatuses).ToArbitrary(),
            (from, to) =>
            {
                var result = _planningStateMachine.CanTransition(from, to);
                var isValid = ValidPlanningTransitions.Contains((from, to));

                return (result == isValid)
                    .Label($"CanTransition({from}, {to}) returned {result}, expected {isValid}");
            });
    }

    /// <summary>
    /// Property 1 (continued): For all invalid planning transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Planning_ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<PlanningApplicationStatus>();

        var invalidPairGen = Gen.Elements(allStatuses)
            .SelectMany(from => Gen.Elements(allStatuses)
                .Where(to => !ValidPlanningTransitions.Contains((from, to)))
                .Select(to => (from, to)));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var act = () => _planningStateMachine.ValidateTransition(pair.from, pair.to);

                act.Should().Throw<InvalidStateTransitionException>()
                    .Which.CurrentStatus.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 1 (continued): For all valid planning transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Fact]
    public void Planning_ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidPlanningTransitions)
        {
            var act = () => _planningStateMachine.ValidateTransition(from, to);
            act.Should().NotThrow(
                $"transition from {from} to {to} should be valid");
        }
    }

    /// <summary>
    /// Property 1 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Fact]
    public void Planning_GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<PlanningApplicationStatus>();

        foreach (var from in allStatuses)
        {
            var expectedTargets = ValidPlanningTransitions
                .Where(t => t.From == from)
                .Select(t => t.To)
                .ToHashSet();

            var actualTargets = _planningStateMachine.GetPermittedTransitions(from).ToHashSet();

            actualTargets.Should().BeEquivalentTo(expectedTargets,
                $"permitted transitions from {from} should match the design specification");
        }
    }

    #endregion

    #region Condition Status State Machine — Property 2

    /// <summary>
    /// The complete set of valid ConditionStatus transitions as defined in the design document.
    /// Outstanding → SubmittedForDischarge, SubmittedForDischarge → Discharged/Rejected, Rejected → SubmittedForDischarge
    /// </summary>
    private static readonly HashSet<(ConditionStatus From, ConditionStatus To)> ValidConditionTransitions = new()
    {
        (ConditionStatus.Outstanding, ConditionStatus.SubmittedForDischarge),
        (ConditionStatus.SubmittedForDischarge, ConditionStatus.Discharged),
        (ConditionStatus.SubmittedForDischarge, ConditionStatus.Rejected),
        (ConditionStatus.Rejected, ConditionStatus.SubmittedForDischarge)
    };

    /// <summary>
    /// Property 2: Condition State Machine Validity — CanTransition returns true
    /// ONLY for valid transitions defined in the design specification.
    ///
    /// For any pair of ConditionStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    ///
    /// **Validates: Requirements 5.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Condition_CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<ConditionStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            Gen.Elements(allStatuses).ToArbitrary(),
            (from, to) =>
            {
                var result = _conditionStateMachine.CanTransition(from, to);
                var isValid = ValidConditionTransitions.Contains((from, to));

                return (result == isValid)
                    .Label($"CanTransition({from}, {to}) returned {result}, expected {isValid}");
            });
    }

    /// <summary>
    /// Property 2 (continued): For all invalid condition transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 5.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Condition_ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<ConditionStatus>();

        var invalidPairGen = Gen.Elements(allStatuses)
            .SelectMany(from => Gen.Elements(allStatuses)
                .Where(to => !ValidConditionTransitions.Contains((from, to)))
                .Select(to => (from, to)));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var act = () => _conditionStateMachine.ValidateTransition(pair.from, pair.to);

                act.Should().Throw<InvalidStateTransitionException>()
                    .Which.CurrentStatus.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 2 (continued): For all valid condition transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 5.4**
    /// </summary>
    [Fact]
    public void Condition_ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidConditionTransitions)
        {
            var act = () => _conditionStateMachine.ValidateTransition(from, to);
            act.Should().NotThrow(
                $"transition from {from} to {to} should be valid");
        }
    }

    /// <summary>
    /// Property 2 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    ///
    /// **Validates: Requirements 5.4**
    /// </summary>
    [Fact]
    public void Condition_GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<ConditionStatus>();

        foreach (var from in allStatuses)
        {
            var expectedTargets = ValidConditionTransitions
                .Where(t => t.From == from)
                .Select(t => t.To)
                .ToHashSet();

            var actualTargets = _conditionStateMachine.GetPermittedTransitions(from).ToHashSet();

            actualTargets.Should().BeEquivalentTo(expectedTargets,
                $"permitted transitions from {from} should match the design specification");
        }
    }

    #endregion
}
