using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="AppealStatus"/> transitions.
/// Enforces valid workflow progressions for planning appeals using a static transition map.
/// </summary>
public class AppealStatusStateMachine : IAppealStatusStateMachine
{
    private static readonly Dictionary<AppealStatus, List<AppealStatus>> TransitionMap = new()
    {
        { AppealStatus.Lodged, [AppealStatus.UnderReview] },
        { AppealStatus.UnderReview, [AppealStatus.HearingScheduled, AppealStatus.Allowed, AppealStatus.Dismissed] },
        { AppealStatus.HearingScheduled, [AppealStatus.Allowed, AppealStatus.Dismissed] },
        { AppealStatus.Allowed, [AppealStatus.Closed] },
        { AppealStatus.Dismissed, [AppealStatus.Closed] },
        { AppealStatus.Closed, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(AppealStatus from, AppealStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<AppealStatus> GetPermittedTransitions(AppealStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<AppealStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(AppealStatus from, AppealStatus to)
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
