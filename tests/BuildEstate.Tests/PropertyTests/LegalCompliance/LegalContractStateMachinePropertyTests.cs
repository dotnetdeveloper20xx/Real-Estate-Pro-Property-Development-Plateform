using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Services.LegalCompliance;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for <see cref="LegalContractStateMachine"/>.
/// Validates that contract state transitions are correctly enforced for all possible status pairs.
///
/// **Validates: Requirements 4.1, 4.2**
/// </summary>
public class LegalContractStateMachinePropertyTests
{
    private readonly LegalContractStateMachine _stateMachine = new();

    /// <summary>
    /// The complete set of 21 valid LegalContractStatus transitions as defined in the design document.
    /// </summary>
    private static readonly HashSet<(LegalContractStatus From, LegalContractStatus To)> ValidTransitions = new()
    {
        (LegalContractStatus.Draft, LegalContractStatus.UnderReview),
        (LegalContractStatus.Draft, LegalContractStatus.Cancelled),
        (LegalContractStatus.UnderReview, LegalContractStatus.Approved),
        (LegalContractStatus.UnderReview, LegalContractStatus.Rejected),
        (LegalContractStatus.UnderReview, LegalContractStatus.Draft),
        (LegalContractStatus.Approved, LegalContractStatus.AwaitingSignature),
        (LegalContractStatus.AwaitingSignature, LegalContractStatus.Executed),
        (LegalContractStatus.AwaitingSignature, LegalContractStatus.Cancelled),
        (LegalContractStatus.Executed, LegalContractStatus.Active),
        (LegalContractStatus.Active, LegalContractStatus.Completed),
        (LegalContractStatus.Active, LegalContractStatus.Terminated),
        (LegalContractStatus.Active, LegalContractStatus.Expired),
        (LegalContractStatus.Active, LegalContractStatus.UnderDispute),
        (LegalContractStatus.UnderDispute, LegalContractStatus.Active),
        (LegalContractStatus.UnderDispute, LegalContractStatus.Terminated),
        (LegalContractStatus.Terminated, LegalContractStatus.Closed),
        (LegalContractStatus.Completed, LegalContractStatus.Closed),
        (LegalContractStatus.Expired, LegalContractStatus.Renewed),
        (LegalContractStatus.Expired, LegalContractStatus.Closed),
        (LegalContractStatus.Renewed, LegalContractStatus.Active),
        (LegalContractStatus.Cancelled, LegalContractStatus.Closed)
    };

    /// <summary>
    /// Property 2: Contract State Machine Correctness — CanTransition returns true
    /// ONLY for the 21 valid transitions defined in the design specification.
    ///
    /// For any pair of LegalContractStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    ///
    /// **Validates: Requirements 4.1, 4.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<LegalContractStatus>();

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
    /// Property 2 (continued): For all invalid contract transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 4.1, 4.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<LegalContractStatus>();

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
    /// Property 2 (continued): For all 21 valid transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 4.1, 4.2**
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
    /// Property 2 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    ///
    /// **Validates: Requirements 4.1, 4.2**
    /// </summary>
    [Fact]
    public void GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<LegalContractStatus>();

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
    /// Validates there are exactly 21 valid transitions in the state machine.
    ///
    /// **Validates: Requirements 4.1, 4.2**
    /// </summary>
    [Fact]
    public void StateMachine_HasExactly21ValidTransitions()
    {
        var allStatuses = Enum.GetValues<LegalContractStatus>();
        var totalValidTransitions = 0;

        foreach (var from in allStatuses)
        {
            totalValidTransitions += _stateMachine.GetPermittedTransitions(from).Count;
        }

        totalValidTransitions.Should().Be(21,
            "the contract state machine should define exactly 21 valid transitions");
    }
}
