using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="OfferStatus"/> transitions.
/// Enforces valid offer workflow progressions.
/// </summary>
public class OfferStateMachine : IOfferStateMachine
{
    private static readonly IReadOnlyDictionary<OfferStatus, IReadOnlyList<OfferStatus>> TransitionMap =
        new Dictionary<OfferStatus, IReadOnlyList<OfferStatus>>
        {
            [OfferStatus.UnderReview] = new List<OfferStatus>
            {
                OfferStatus.Accepted,
                OfferStatus.Rejected,
                OfferStatus.CounterOffered,
                OfferStatus.Expired
            }.AsReadOnly(),

            [OfferStatus.CounterOffered] = new List<OfferStatus>
            {
                OfferStatus.UnderReview,
                OfferStatus.Accepted,
                OfferStatus.Rejected
            }.AsReadOnly(),

            [OfferStatus.Accepted] = new List<OfferStatus>().AsReadOnly(),
            [OfferStatus.Rejected] = new List<OfferStatus>().AsReadOnly(),
            [OfferStatus.Expired] = new List<OfferStatus>().AsReadOnly()
        };

    /// <inheritdoc />
    public bool CanTransition(OfferStatus from, OfferStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<OfferStatus> GetPermittedTransitions(OfferStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted
            : Array.Empty<OfferStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(OfferStatus from, OfferStatus to)
    {
        if (CanTransition(from, to))
        {
            return;
        }

        var permitted = GetPermittedTransitions(from)
            .Select(s => s.ToString())
            .ToList();

        throw new InvalidStateTransitionException(
            from.ToString(),
            to.ToString(),
            permitted);
    }
}
