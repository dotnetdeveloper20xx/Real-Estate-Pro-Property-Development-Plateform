using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for <see cref="OfferStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible status pairs.
/// 
/// **Validates: Requirements 7.3**
/// </summary>
public class OfferStateMachinePropertyTests
{
    private readonly OfferStateMachine _stateMachine = new();

    /// <summary>
    /// The complete set of valid transitions as defined in the design document's
    /// Offer Status Transitions table.
    /// </summary>
    private static readonly HashSet<(OfferStatus From, OfferStatus To)> ValidTransitions = new()
    {
        (OfferStatus.UnderReview, OfferStatus.Accepted),
        (OfferStatus.UnderReview, OfferStatus.Rejected),
        (OfferStatus.UnderReview, OfferStatus.CounterOffered),
        (OfferStatus.UnderReview, OfferStatus.Expired),
        (OfferStatus.CounterOffered, OfferStatus.UnderReview),
        (OfferStatus.CounterOffered, OfferStatus.Accepted),
        (OfferStatus.CounterOffered, OfferStatus.Rejected)
    };

    /// <summary>
    /// Property 3: Offer State Machine Correctness — CanTransition returns true
    /// ONLY for valid transitions.
    /// 
    /// For any pair of OfferStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<OfferStatus>();

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
    /// Property 3 (continued): For all invalid Offer transitions, ValidateTransition throws
    /// InvalidStateTransitionException.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<OfferStatus>();

        // Generate only invalid pairs
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
    /// Property 3 (continued): For all valid Offer transitions, ValidateTransition does NOT throw.
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
    /// Property 3 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    /// </summary>
    [Fact]
    public void GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<OfferStatus>();

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
}
