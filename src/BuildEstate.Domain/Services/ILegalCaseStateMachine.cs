using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="LegalCaseStatus"/> transitions.
/// Enforces valid workflow progressions for legal cases.
/// </summary>
public interface ILegalCaseStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(LegalCaseStatus from, LegalCaseStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<LegalCaseStatus> GetPermittedTransitions(LegalCaseStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(LegalCaseStatus from, LegalCaseStatus to);
}
