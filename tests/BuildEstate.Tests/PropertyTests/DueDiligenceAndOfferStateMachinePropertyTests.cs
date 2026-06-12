using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for <see cref="DueDiligenceStateMachine"/> and <see cref="OfferStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible status pairs.
///
/// **Validates: Requirements 5.3, 7.3**
/// </summary>
public class DueDiligenceAndOfferStateMachinePropertyTests
{
    private readonly DueDiligenceStateMachine _ddStateMachine = new();
    private readonly OfferStateMachine _offerStateMachine = new();

    #region Due Diligence State Machine — Property 2

    /// <summary>
    /// The complete set of valid DueDiligence transitions as defined in the design document.
    /// Pending → InProgress, InProgress → {Completed, Failed}
    /// </summary>
    private static readonly HashSet<(DueDiligenceStatus From, DueDiligenceStatus To)> ValidDdTransitions = new()
    {
        (DueDiligenceStatus.Pending, DueDiligenceStatus.InProgress),
        (DueDiligenceStatus.InProgress, DueDiligenceStatus.Completed),
        (DueDiligenceStatus.InProgress, DueDiligenceStatus.Failed)
    };

    /// <summary>
    /// Property 2: Due Diligence State Machine Correctness — CanTransition returns true
    /// ONLY for valid transitions defined in the design specification.
    ///
    /// For any pair of DueDiligenceStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DueDiligence_CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<DueDiligenceStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            Gen.Elements(allStatuses).ToArbitrary(),
            (from, to) =>
            {
                var result = _ddStateMachine.CanTransition(from, to);
                var isValid = ValidDdTransitions.Contains((from, to));

                return (result == isValid)
                    .Label($"CanTransition({from}, {to}) returned {result}, expected {isValid}");
            });
    }

    /// <summary>
    /// Property 2 (continued): For all invalid DD transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DueDiligence_ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<DueDiligenceStatus>();

        var invalidPairGen = Gen.Elements(allStatuses)
            .SelectMany(from => Gen.Elements(allStatuses)
                .Where(to => !ValidDdTransitions.Contains((from, to)))
                .Select(to => (from, to)));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var act = () => _ddStateMachine.ValidateTransition(pair.from, pair.to);

                act.Should().Throw<InvalidStateTransitionException>()
                    .Which.CurrentStatus.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 2 (continued): For all valid DD transitions, ValidateTransition does NOT throw.
    /// </summary>
    [Fact]
    public void DueDiligence_ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidDdTransitions)
        {
            var act = () => _ddStateMachine.ValidateTransition(from, to);
            act.Should().NotThrow(
                $"transition from {from} to {to} should be valid");
        }
    }

    /// <summary>
    /// Property 2 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    /// </summary>
    [Fact]
    public void DueDiligence_GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<DueDiligenceStatus>();

        foreach (var from in allStatuses)
        {
            var expectedTargets = ValidDdTransitions
                .Where(t => t.From == from)
                .Select(t => t.To)
                .ToHashSet();

            var actualTargets = _ddStateMachine.GetPermittedTransitions(from).ToHashSet();

            actualTargets.Should().BeEquivalentTo(expectedTargets,
                $"permitted transitions from {from} should match the design specification");
        }
    }

    #endregion

    #region Offer State Machine — Property 3

    /// <summary>
    /// The complete set of valid Offer transitions as defined in the design document.
    /// UnderReview → {Accepted, Rejected, CounterOffered, Expired}
    /// CounterOffered → {UnderReview, Accepted, Rejected}
    /// </summary>
    private static readonly HashSet<(OfferStatus From, OfferStatus To)> ValidOfferTransitions = new()
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
    /// ONLY for valid transitions defined in the design specification.
    ///
    /// For any pair of OfferStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Offer_CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<OfferStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            Gen.Elements(allStatuses).ToArbitrary(),
            (from, to) =>
            {
                var result = _offerStateMachine.CanTransition(from, to);
                var isValid = ValidOfferTransitions.Contains((from, to));

                return (result == isValid)
                    .Label($"CanTransition({from}, {to}) returned {result}, expected {isValid}");
            });
    }

    /// <summary>
    /// Property 3 (continued): For all invalid Offer transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Offer_ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<OfferStatus>();

        var invalidPairGen = Gen.Elements(allStatuses)
            .SelectMany(from => Gen.Elements(allStatuses)
                .Where(to => !ValidOfferTransitions.Contains((from, to)))
                .Select(to => (from, to)));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var act = () => _offerStateMachine.ValidateTransition(pair.from, pair.to);

                act.Should().Throw<InvalidStateTransitionException>()
                    .Which.CurrentStatus.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 3 (continued): For all valid Offer transitions, ValidateTransition does NOT throw.
    /// </summary>
    [Fact]
    public void Offer_ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidOfferTransitions)
        {
            var act = () => _offerStateMachine.ValidateTransition(from, to);
            act.Should().NotThrow(
                $"transition from {from} to {to} should be valid");
        }
    }

    /// <summary>
    /// Property 3 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    /// </summary>
    [Fact]
    public void Offer_GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<OfferStatus>();

        foreach (var from in allStatuses)
        {
            var expectedTargets = ValidOfferTransitions
                .Where(t => t.From == from)
                .Select(t => t.To)
                .ToHashSet();

            var actualTargets = _offerStateMachine.GetPermittedTransitions(from).ToHashSet();

            actualTargets.Should().BeEquivalentTo(expectedTargets,
                $"permitted transitions from {from} should match the design specification");
        }
    }

    #endregion
}
