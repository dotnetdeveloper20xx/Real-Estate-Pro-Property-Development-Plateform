using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Services.LegalCompliance;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for <see cref="AuditRecordStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible AuditRecordStatus pairs.
///
/// **Validates: Requirements 9.3**
/// </summary>
public class AuditRecordStateMachinePropertyTests
{
    private readonly AuditRecordStateMachine _stateMachine = new();

    /// <summary>
    /// The complete set of valid AuditRecordStatus transitions (7 total) as defined in the design document.
    /// </summary>
    private static readonly HashSet<(AuditRecordStatus From, AuditRecordStatus To)> ValidTransitions = new()
    {
        (AuditRecordStatus.Planned, AuditRecordStatus.InProgress),
        (AuditRecordStatus.InProgress, AuditRecordStatus.FindingsRecorded),
        (AuditRecordStatus.FindingsRecorded, AuditRecordStatus.ActionsRequired),
        (AuditRecordStatus.FindingsRecorded, AuditRecordStatus.Closed),
        (AuditRecordStatus.ActionsRequired, AuditRecordStatus.RemediationInProgress),
        (AuditRecordStatus.RemediationInProgress, AuditRecordStatus.Verified),
        (AuditRecordStatus.Verified, AuditRecordStatus.Closed)
    };

    /// <summary>
    /// Property 4: AuditRecord State Machine Correctness — CanTransition returns true
    /// ONLY for the 7 valid transitions defined in the design specification.
    ///
    /// For any pair of AuditRecordStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    ///
    /// **Validates: Requirements 9.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<AuditRecordStatus>();

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
    /// Property 4 (continued): For all invalid AuditRecord transitions, ValidateTransition throws
    /// InvalidStateTransitionException with correct state information.
    ///
    /// **Validates: Requirements 9.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<AuditRecordStatus>();

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
    /// Property 4 (continued): For all 7 valid transitions, ValidateTransition does NOT throw.
    ///
    /// **Validates: Requirements 9.3**
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
    /// Property 4 (continued): GetPermittedTransitions returns exactly the expected targets
    /// for each source status.
    ///
    /// **Validates: Requirements 9.3**
    /// </summary>
    [Fact]
    public void GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<AuditRecordStatus>();

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
    /// Verifies the total number of valid transitions is exactly 7.
    ///
    /// **Validates: Requirements 9.3**
    /// </summary>
    [Fact]
    public void ValidTransitions_ContainsExactly7Transitions()
    {
        ValidTransitions.Should().HaveCount(7,
            "the AuditRecord state machine defines exactly 7 valid transitions");
    }
}
