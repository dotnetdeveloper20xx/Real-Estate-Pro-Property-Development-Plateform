using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="PaymentStatus"/> transitions on planning fees.
/// Enforces valid workflow progressions for fee payment statuses.
/// Note: Fee threshold enforcement (amounts above threshold cannot go Pending → Paid directly)
/// is handled in the command handler, not in this state machine.
/// </summary>
public interface IFeeStatusStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(PaymentStatus from, PaymentStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<PaymentStatus> GetPermittedTransitions(PaymentStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(PaymentStatus from, PaymentStatus to);
}
