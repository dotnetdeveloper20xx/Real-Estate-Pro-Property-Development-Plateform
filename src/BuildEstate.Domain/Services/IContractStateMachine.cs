using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="ContractStatus"/> transitions.
/// Enforces valid workflow progressions for contracts.
/// </summary>
public interface IContractStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(ContractStatus from, ContractStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<ContractStatus> GetPermittedTransitions(ContractStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(ContractStatus from, ContractStatus to);
}
