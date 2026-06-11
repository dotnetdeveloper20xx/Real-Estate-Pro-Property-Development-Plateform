using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="OfferStatus"/> transitions.
/// Enforces valid workflow progressions for offers.
/// </summary>
public interface IOfferStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(OfferStatus from, OfferStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<OfferStatus> GetPermittedTransitions(OfferStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(OfferStatus from, OfferStatus to);
}
