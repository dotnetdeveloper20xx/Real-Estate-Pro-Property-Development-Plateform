using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="OpportunityStatus"/> transitions.
/// Enforces valid workflow progressions for land opportunities using a static transition map.
/// </summary>
public class OpportunityStateMachine : IOpportunityStateMachine
{
    private static readonly Dictionary<OpportunityStatus, List<OpportunityStatus>> TransitionMap = new()
    {
        { OpportunityStatus.Identified, [OpportunityStatus.InitialReview, OpportunityStatus.Withdrawn] },
        { OpportunityStatus.InitialReview, [OpportunityStatus.DueDiligence, OpportunityStatus.Withdrawn] },
        { OpportunityStatus.DueDiligence, [OpportunityStatus.OfferMade, OpportunityStatus.Withdrawn] },
        { OpportunityStatus.OfferMade, [OpportunityStatus.UnderContract, OpportunityStatus.Withdrawn] },
        { OpportunityStatus.UnderContract, [OpportunityStatus.Acquired, OpportunityStatus.Withdrawn] },
        { OpportunityStatus.Acquired, [] },
        { OpportunityStatus.Withdrawn, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(OpportunityStatus from, OpportunityStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<OpportunityStatus> GetPermittedTransitions(OpportunityStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<OpportunityStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(OpportunityStatus from, OpportunityStatus to)
    {
        if (CanTransition(from, to))
        {
            return;
        }

        var permitted = GetPermittedTransitions(from);
        var permittedNames = permitted.Select(s => s.ToString()).ToList();

        throw new InvalidStateTransitionException(
            from.ToString(),
            to.ToString(),
            permittedNames);
    }
}
