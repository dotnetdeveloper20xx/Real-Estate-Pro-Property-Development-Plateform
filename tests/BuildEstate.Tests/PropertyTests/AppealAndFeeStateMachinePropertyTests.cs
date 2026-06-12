using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for <see cref="AppealStatusStateMachine"/> and <see cref="FeeStatusStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible status pairs.
///
/// **Validates: Requirements 6.5, 8.4**
/// </summary>
public class AppealAndFeeStateMachinePropertyTests
{
    private readonly AppealStatusStateMachine _appealStateMachine = new();
    private readonly FeeStatusStateMachine _feeStateMachine = new();

    #region Appeal State Machine — Property 3

    /// <summary>
    /// The complete set of valid Appeal transitions as defined in the design document.
    /// Lodged → UnderReview
    /// UnderReview → {HearingScheduled, Allowed, Dismissed}
    /// HearingScheduled → {Allowed, Dismissed}
    /// Allowed → Closed
    /// Dismissed → Closed
    /// </summary>
    private static readonly HashSet<(AppealStatus From, AppealStatus To)> ValidAppealTransitions = new()
    {
        (AppealStatus.Lodged, AppealStatus.UnderReview),
        (AppealStatus.UnderReview, AppealStatus.HearingScheduled),
        (AppealStatus.UnderReview, AppealStatus.Allowed),
        (AppealStatus.UnderReview, AppealStatus.Dismissed),
        (AppealStatus.HearingScheduled, AppealStatus.Allowed),
        (AppealStatus.HearingScheduled, AppealStatus.Dismissed),
        (AppealStatus.Allowed, AppealStatus.Closed),
        (AppealStatus.Dismissed, AppealStatus.Closed)
    };

    /// <summary>
    /// Property 3: Appeal State Machine Correctness — CanTransition returns true
    /// ONLY for valid transitions defined in the design specification.
    ///
    /// For any pair of AppealStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Appeal_CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<AppealStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            Gen.Elements(allStatuses).ToArbitrary(),
            (from, to) =>
            {
                var result = _appealStateMachine.CanTransition(from, to);
                var isValid = ValidAppealTransitions.Contains((from, to));

                return (result == isValid)
                    .Label($"CanTransition({from}, {to}) returned {result}, expected {isValid}");
            });
    }

    /// <summary>
    /// Property 3 (continued): For all invalid Appeal transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Appeal_ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<AppealStatus>();

        var invalidPairGen = Gen.Elements(allStatuses)
            .SelectMany(from => Gen.Elements(allStatuses)
                .Where(to => !ValidAppealTransitions.Contains((from, to)))
                .Select(to => (from, to)));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var act = () => _appealStateMachine.ValidateTransition(pair.from, pair.to);

                act.Should().Throw<InvalidStateTransitionException>()
                    .Which.CurrentStatus.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 3 (continued): For all valid Appeal transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Fact]
    public void Appeal_ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidAppealTransitions)
        {
            var act = () => _appealStateMachine.ValidateTransition(from, to);
            act.Should().NotThrow(
                $"transition from {from} to {to} should be valid");
        }
    }

    /// <summary>
    /// Property 3 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Fact]
    public void Appeal_GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<AppealStatus>();

        foreach (var from in allStatuses)
        {
            var expectedTargets = ValidAppealTransitions
                .Where(t => t.From == from)
                .Select(t => t.To)
                .ToHashSet();

            var actualTargets = _appealStateMachine.GetPermittedTransitions(from).ToHashSet();

            actualTargets.Should().BeEquivalentTo(expectedTargets,
                $"permitted transitions from {from} should match the design specification");
        }
    }

    #endregion

    #region Fee State Machine — Property 4

    /// <summary>
    /// The complete set of valid Fee (PaymentStatus) transitions as defined in the design document.
    /// Pending → {AwaitingApproval, Paid}
    /// AwaitingApproval → {Approved, Rejected}
    /// Approved → Paid
    /// Rejected → Pending
    /// </summary>
    private static readonly HashSet<(PaymentStatus From, PaymentStatus To)> ValidFeeTransitions = new()
    {
        (PaymentStatus.Pending, PaymentStatus.AwaitingApproval),
        (PaymentStatus.Pending, PaymentStatus.Paid),
        (PaymentStatus.AwaitingApproval, PaymentStatus.Approved),
        (PaymentStatus.AwaitingApproval, PaymentStatus.Rejected),
        (PaymentStatus.Approved, PaymentStatus.Paid),
        (PaymentStatus.Rejected, PaymentStatus.Pending)
    };

    /// <summary>
    /// Property 4: Fee Payment Status State Machine Correctness — CanTransition returns true
    /// ONLY for valid transitions defined in the design specification.
    ///
    /// For any pair of PaymentStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    ///
    /// **Validates: Requirements 8.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Fee_CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<PaymentStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            Gen.Elements(allStatuses).ToArbitrary(),
            (from, to) =>
            {
                var result = _feeStateMachine.CanTransition(from, to);
                var isValid = ValidFeeTransitions.Contains((from, to));

                return (result == isValid)
                    .Label($"CanTransition({from}, {to}) returned {result}, expected {isValid}");
            });
    }

    /// <summary>
    /// Property 4 (continued): For all invalid Fee transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 8.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Fee_ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<PaymentStatus>();

        var invalidPairGen = Gen.Elements(allStatuses)
            .SelectMany(from => Gen.Elements(allStatuses)
                .Where(to => !ValidFeeTransitions.Contains((from, to)))
                .Select(to => (from, to)));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var act = () => _feeStateMachine.ValidateTransition(pair.from, pair.to);

                act.Should().Throw<InvalidStateTransitionException>()
                    .Which.CurrentStatus.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 4 (continued): For all valid Fee transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 8.4**
    /// </summary>
    [Fact]
    public void Fee_ValidateTransition_DoesNotThrow_ForAllValidTransitions()
    {
        foreach (var (from, to) in ValidFeeTransitions)
        {
            var act = () => _feeStateMachine.ValidateTransition(from, to);
            act.Should().NotThrow(
                $"transition from {from} to {to} should be valid");
        }
    }

    /// <summary>
    /// Property 4 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    ///
    /// **Validates: Requirements 8.4**
    /// </summary>
    [Fact]
    public void Fee_GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<PaymentStatus>();

        foreach (var from in allStatuses)
        {
            var expectedTargets = ValidFeeTransitions
                .Where(t => t.From == from)
                .Select(t => t.To)
                .ToHashSet();

            var actualTargets = _feeStateMachine.GetPermittedTransitions(from).ToHashSet();

            actualTargets.Should().BeEquivalentTo(expectedTargets,
                $"permitted transitions from {from} should match the design specification");
        }
    }

    #endregion
}
