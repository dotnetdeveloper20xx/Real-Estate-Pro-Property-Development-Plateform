using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for the ContractStateMachine.
/// **Validates: Requirements 8.2**
/// 
/// Property 4: Contract State Machine Correctness — for ALL pairs of (ContractStatus from, ContractStatus to),
/// the state machine SHALL permit the transition if and only if (from, to) is in the valid set.
/// </summary>
public class ContractStateMachinePropertyTests
{
    private static readonly HashSet<(ContractStatus From, ContractStatus To)> ValidTransitions = new()
    {
        (ContractStatus.Draft, ContractStatus.UnderLegalReview),
        (ContractStatus.UnderLegalReview, ContractStatus.Approved),
        (ContractStatus.UnderLegalReview, ContractStatus.Rejected),
        (ContractStatus.Approved, ContractStatus.Signed),
        (ContractStatus.Signed, ContractStatus.Exchanged),
        (ContractStatus.Exchanged, ContractStatus.Completed)
    };

    private readonly ContractStateMachine _stateMachine = new();

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// For any pair of ContractStatus values (from, to), CanTransition returns true
    /// if and only if the pair is in the valid transition set.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CanTransition_ReturnsTrue_OnlyForValidPairs()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);
        var pairGen = Gen.Two(statusGen).Select(t => (From: t.Item1, To: t.Item2));

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var result = _stateMachine.CanTransition(pair.From, pair.To);
            var expected = ValidTransitions.Contains((pair.From, pair.To));

            result.Should().Be(expected,
                because: $"transition from {pair.From} to {pair.To} should be {(expected ? "valid" : "invalid")}");
        });
    }

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// For any invalid (from, to) pair, ValidateTransition SHALL throw InvalidStateTransitionException
    /// containing the list of permitted transitions from the current status.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ValidateTransition_ThrowsForInvalidPairs_WithPermittedList()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);
        var pairGen = Gen.Two(statusGen)
            .Select(t => (From: t.Item1, To: t.Item2))
            .Where(pair => !ValidTransitions.Contains((pair.From, pair.To)));

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var act = () => _stateMachine.ValidateTransition(pair.From, pair.To);

            var exception = act.Should().Throw<InvalidStateTransitionException>().Which;

            exception.CurrentStatus.Should().Be(pair.From.ToString());
            exception.AttemptedStatus.Should().Be(pair.To.ToString());

            // Verify the permitted transitions in the exception match what the state machine reports
            var expectedPermitted = _stateMachine.GetPermittedTransitions(pair.From)
                .Select(s => s.ToString())
                .ToList();
            exception.PermittedTransitions.Should().BeEquivalentTo(expectedPermitted);
        });
    }

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// For any valid (from, to) pair, ValidateTransition SHALL NOT throw.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ValidateTransition_DoesNotThrow_ForValidPairs()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);
        var pairGen = Gen.Two(statusGen)
            .Select(t => (From: t.Item1, To: t.Item2))
            .Where(pair => ValidTransitions.Contains((pair.From, pair.To)));

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var act = () => _stateMachine.ValidateTransition(pair.From, pair.To);
            act.Should().NotThrow();
        });
    }

    /// <summary>
    /// Property 4: Contract State Machine Correctness
    /// GetPermittedTransitions returns only statuses that are valid targets from the given status.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property GetPermittedTransitions_ReturnsOnlyValidTargets()
    {
        var allStatuses = Enum.GetValues<ContractStatus>();
        var statusGen = Gen.Elements(allStatuses);

        return Prop.ForAll(statusGen.ToArbitrary(), fromStatus =>
        {
            var permitted = _stateMachine.GetPermittedTransitions(fromStatus);

            var expectedPermitted = ValidTransitions
                .Where(t => t.From == fromStatus)
                .Select(t => t.To)
                .ToList();

            permitted.Should().BeEquivalentTo(expectedPermitted,
                because: $"permitted transitions from {fromStatus} should match the defined valid set");
        });
    }
}
