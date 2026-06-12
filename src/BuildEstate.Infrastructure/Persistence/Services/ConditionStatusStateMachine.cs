using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="ConditionStatus"/> transitions.
/// Enforces valid workflow progressions for planning conditions using a static transition map.
/// </summary>
public class ConditionStatusStateMachine : IConditionStatusStateMachine
{
    private static readonly Dictionary<ConditionStatus, List<ConditionStatus>> TransitionMap = new()
    {
        { ConditionStatus.Outstanding, [ConditionStatus.SubmittedForDischarge] },
        { ConditionStatus.SubmittedForDischarge, [ConditionStatus.Discharged, ConditionStatus.Rejected] },
        { ConditionStatus.Rejected, [ConditionStatus.SubmittedForDischarge] },
        { ConditionStatus.Discharged, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(ConditionStatus from, ConditionStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<ConditionStatus> GetPermittedTransitions(ConditionStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<ConditionStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(ConditionStatus from, ConditionStatus to)
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
