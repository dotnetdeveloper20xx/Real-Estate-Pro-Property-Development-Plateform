using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="PlanningApplicationStatus"/> transitions.
/// Enforces valid workflow progressions for planning applications.
/// </summary>
public interface IPlanningStatusStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(PlanningApplicationStatus from, PlanningApplicationStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<PlanningApplicationStatus> GetPermittedTransitions(PlanningApplicationStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(PlanningApplicationStatus from, PlanningApplicationStatus to);
}
