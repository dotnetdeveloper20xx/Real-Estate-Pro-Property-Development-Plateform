using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="InsuranceStatus"/> transitions.
/// Enforces valid workflow progressions for insurance records.
/// </summary>
public interface IInsuranceStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(InsuranceStatus from, InsuranceStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<InsuranceStatus> GetPermittedTransitions(InsuranceStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(InsuranceStatus from, InsuranceStatus to);
}
