using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="DueDiligenceStatus"/> transitions.
/// Enforces valid workflow progressions for due diligence checks.
/// </summary>
public interface IDueDiligenceStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(DueDiligenceStatus from, DueDiligenceStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<DueDiligenceStatus> GetPermittedTransitions(DueDiligenceStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(DueDiligenceStatus from, DueDiligenceStatus to);
}
