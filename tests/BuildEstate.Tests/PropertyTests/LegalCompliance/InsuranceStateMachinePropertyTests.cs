using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Services.LegalCompliance;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for <see cref="InsuranceStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible InsuranceStatus pairs.
///
/// **Validates: Requirements 7.3**
/// </summary>
public class InsuranceStateMachinePropertyTests
{
    private readonly InsuranceStateMachine _stateMachine = new();

    /// <summary>
    /// The complete set of valid InsuranceStatus transitions (8 total) as defined in the design document.
    /// Active→ExpiringSoon, Active→Cancelled, ExpiringSoon→Renewed, ExpiringSoon→Expired,
    /// ExpiringSoon→Cancelled, Expired→Renewed, Renewed→Active, Cancelled→Closed
    /// </summary>
    private static readonly HashSet<(InsuranceStatus From, InsuranceStatus To)> ValidTransitions = new()
    {
        (InsuranceStatus.Active, InsuranceStatus.ExpiringSoon),
        (InsuranceStatus.Active, InsuranceStatus.Cancelled),
        (InsuranceStatus.ExpiringSoon, InsuranceStatus.Renewed),
        (InsuranceStatus.ExpiringSoon, InsuranceStatus.Expired),
        (InsuranceStatus.ExpiringSoon, InsuranceStatus.Cancelled),
        (InsuranceStatus.Expired, InsuranceStatus.Renewed),
        (InsuranceStatus.Renewed, InsuranceStatus.Active),
        (InsuranceStatus.Cancelled, InsuranceStatus.Closed)
    };

    #region Property 3: Insurance State Machine Correctness

    /// <summary>
    /// Property 3: Insurance State Machine Correctness — CanTransition returns true
    /// ONLY for valid transitions defined in the design specification.
    ///
    /// For any pair of InsuranceStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set of 8 defined transitions.
    ///
    /// **Validates: Requirements 7.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Insurance_CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<InsuranceStatus>();

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
    /// Property 3 (continued): For all invalid insurance transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 7.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Insurance_ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<InsuranceStatus>();

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
    /// Property 3 (continued): For all valid insurance transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 7.3**
    /// </summary>
    [Fact]
    public void Insurance_ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidTransitions)
        {
            var act = () => _stateMachine.ValidateTransition(from, to);
            act.Should().NotThrow(
                $"transition from {from} to {to} should be valid");
        }
    }

    /// <summary>
    /// Property 3 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    ///
    /// **Validates: Requirements 7.3**
    /// </summary>
    [Fact]
    public void Insurance_GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<InsuranceStatus>();

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

    #endregion
}
