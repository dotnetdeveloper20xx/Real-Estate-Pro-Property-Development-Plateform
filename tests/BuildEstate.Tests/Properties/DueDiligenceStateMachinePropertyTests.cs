using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for <see cref="DueDiligenceStateMachine"/>.
/// Validates that state transitions are correctly enforced for all possible status pairs.
/// 
/// **Validates: Requirements 5.3**
/// </summary>
public class DueDiligenceStateMachinePropertyTests
{
    private readonly DueDiligenceStateMachine _stateMachine = new();

    /// <summary>
    /// The complete set of valid transitions as defined in the design document.
    /// </summary>
    private static readonly HashSet<(DueDiligenceStatus From, DueDiligenceStatus To)> ValidTransitions = new()
    {
        (DueDiligenceStatus.Pending, DueDiligenceStatus.InProgress),
        (DueDiligenceStatus.InProgress, DueDiligenceStatus.Completed),
        (DueDiligenceStatus.InProgress, DueDiligenceStatus.Failed)
    };

    /// <summary>
    /// Property 2: Due Diligence State Machine Correctness — CanTransition returns true
    /// ONLY for valid transitions.
    /// 
    /// For any pair of DueDiligenceStatus values (from, to), CanTransition SHALL return true
    /// if and only if (from, to) is in the valid transitions set.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CanTransition_ReturnsTrue_OnlyForValidTransitions()
    {
        var allStatuses = Enum.GetValues<DueDiligenceStatus>();

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
    /// Property 2 (continued): For all invalid DD transitions, ValidateTransition throws
    /// InvalidStateTransitionException.
    /// 
    /// For all pairs NOT in the valid set, ValidateTransition SHALL throw.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ValidateTransition_ThrowsForInvalidTransitions()
    {
        var allStatuses = Enum.GetValues<DueDiligenceStatus>();

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
                    .Which.CurrentState.Should().Be(pair.from.ToString());

                return true;
            });
    }

    /// <summary>
    /// Property 2 (continued): For all valid DD transitions, ValidateTransition does NOT throw.
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
    /// </summary>
    [Fact]
    public void GetPermittedTransitions_ReturnsCorrectTargets_ForEachStatus()
    {
        var allStatuses = Enum.GetValues<DueDiligenceStatus>();

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
