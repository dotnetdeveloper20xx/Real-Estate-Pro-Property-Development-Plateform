using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="DueDiligenceStatus"/> transitions.
/// Enforces valid workflow progressions for due diligence checks using a static transition map.
/// </summary>
public class DueDiligenceStateMachine : IDueDiligenceStateMachine
{
    private static readonly Dictionary<DueDiligenceStatus, List<DueDiligenceStatus>> TransitionMap = new()
    {
        { DueDiligenceStatus.Pending, [DueDiligenceStatus.InProgress] },
        { DueDiligenceStatus.InProgress, [DueDiligenceStatus.Completed, DueDiligenceStatus.Failed] },
        { DueDiligenceStatus.Completed, [] },
        { DueDiligenceStatus.Failed, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(DueDiligenceStatus from, DueDiligenceStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<DueDiligenceStatus> GetPermittedTransitions(DueDiligenceStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<DueDiligenceStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(DueDiligenceStatus from, DueDiligenceStatus to)
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
