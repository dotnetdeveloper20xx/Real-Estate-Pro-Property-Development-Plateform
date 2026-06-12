using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="LegalContractStatus"/> transitions.
/// Enforces valid workflow progressions for legal contracts.
/// </summary>
public interface ILegalContractStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(LegalContractStatus from, LegalContractStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<LegalContractStatus> GetPermittedTransitions(LegalContractStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(LegalContractStatus from, LegalContractStatus to);
}
