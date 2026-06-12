using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Services.LegalCompliance;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for <see cref="LegalCaseStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible LegalCaseStatus pairs.
///
/// **Validates: Requirements 2.1, 2.2**
/// </summary>
public class LegalCaseStateMachinePropertyTests
{
    private readonly LegalCaseStateMachine _stateMachine = new();

    /// <summary>
    /// The complete set of valid LegalCaseStatus transitions (15 total) as defined in the design document.
    /// </summary>
    private static readonly HashSet<(LegalCaseStatus From, LegalCaseStatus To)> ValidTransitions = new()
    {
        (LegalCaseStatus.Open, LegalCaseStatus.InProgress),
        (LegalCaseStatus.Open, LegalCaseStatus.OnHold),
        (LegalCaseStatus.InProgress, LegalCaseStatus.UnderReview),
        (LegalCaseStatus.InProgress, LegalCaseStatus.OnHold),
        (LegalCaseStatus.InProgress, LegalCaseStatus.Escalated),
        (LegalCaseStatus.UnderReview, LegalCaseStatus.Resolved),
        (LegalCaseStatus.UnderReview, LegalCaseStatus.Escalated),
        (LegalCaseStatus.UnderReview, LegalCaseStatus.InProgress),
        (LegalCaseStatus.OnHold, LegalCaseStatus.Open),
        (LegalCaseStatus.OnHold, LegalCaseStatus.InProgress),
        (LegalCaseStatus.Escalated, LegalCaseStatus.InProgress),
        (LegalCaseStatus.Escalated, LegalCaseStatus.UnderReview),
        (LegalCaseStatus.Resolved, LegalCaseStatus.Closed),
        (LegalCaseStatus.Closed, LegalCaseStatus.Reopened),
        (LegalCaseStatus.Reopened, LegalCaseStatus.InProgress)
    };

    /// <summary>
    /// Property 1: LegalCase State Machine Correctness — CanTransition returns true
    /// ONLY for the 15 valid transitions defined in the design specification.
    ///
    /// For any pair of LegalCaseStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<LegalCaseStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            Gen.Elements(allStatuses).ToArbitrary(),
            (from, to) =>
            {
                var result = _stateMachine.CanTransition(from, to);
                var isValid = ValidTransitions.Contains((from, to));

                return (result == isValid)
                    .Label($"CanTransition({from}, {to}) returned {result}, expected {isValid}");
            });
    }

    /// <summary>
    /// Property 1 (continued): For all invalid LegalCase transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<LegalCaseStatus>();

        var invalidPairGen = Gen.Elements(allStatuses)
            .SelectMany(from => Gen.Elements(allStatuses)
                .Where(to => !ValidTransitions.Contains((from, to)))
                .Select(to => (from, to)));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var act = () => _stateMachine.ValidateTransition(pair.from, pair.to);

                act.Should().Throw<InvalidStateTransitionException>()
                    .Which.CurrentStatus.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 1 (continued): For all 15 valid transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Fact]
    public void ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidTransitions)
        {
            var act = () => _stateMachine.ValidateTransition(from, to);
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
    public void GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<LegalCaseStatus>();

        foreach (var from in allStatuses)
        {
            var expectedTargets = ValidTransitions
                .Where(t => t.From == from)
                .Select(t => t.To)
                .ToHashSet();

            var actualTargets = _stateMachine.GetPermittedTransitions(from).ToHashSet();

            actualTargets.Should().BeEquivalentTo(expectedTargets,
                $"permitted transitions from {from} should match the design specification");
        }
    }

    /// <summary>
    /// Verifies the total number of valid transitions is exactly 15.
    ///
    /// **Validates: Requirements 2.1, 2.2**
    /// </summary>
    [Fact]
    public void ValidTransitions_ContainsExactly15Transitions()
    {
        ValidTransitions.Should().HaveCount(15,
            "the LegalCase state machine defines exactly 15 valid transitions");
    }
}
