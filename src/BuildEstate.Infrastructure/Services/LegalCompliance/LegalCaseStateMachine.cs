using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Services.LegalCompliance;

/// <summary>
/// Implements the state machine for <see cref="LegalCaseStatus"/> transitions.
/// Enforces valid workflow progressions for legal cases using a static transition map.
/// </summary>
public class LegalCaseStateMachine : ILegalCaseStateMachine
{
    private static readonly Dictionary<LegalCaseStatus, List<LegalCaseStatus>> TransitionMap = new()
    {
        { LegalCaseStatus.Open, [LegalCaseStatus.InProgress, LegalCaseStatus.OnHold] },
        { LegalCaseStatus.InProgress, [LegalCaseStatus.UnderReview, LegalCaseStatus.OnHold, LegalCaseStatus.Escalated] },
        { LegalCaseStatus.UnderReview, [LegalCaseStatus.Resolved, LegalCaseStatus.Escalated, LegalCaseStatus.InProgress] },
        { LegalCaseStatus.OnHold, [LegalCaseStatus.Open, LegalCaseStatus.InProgress] },
        { LegalCaseStatus.Escalated, [LegalCaseStatus.InProgress, LegalCaseStatus.UnderReview] },
        { LegalCaseStatus.Resolved, [LegalCaseStatus.Closed] },
        { LegalCaseStatus.Closed, [LegalCaseStatus.Reopened] },
        { LegalCaseStatus.Reopened, [LegalCaseStatus.InProgress] }
    };

    /// <inheritdoc />
    public bool CanTransition(LegalCaseStatus from, LegalCaseStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<LegalCaseStatus> GetPermittedTransitions(LegalCaseStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<LegalCaseStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(LegalCaseStatus from, LegalCaseStatus to)
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
            permittedNames,
            "LegalCase");
    }
}
