using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="PlanningApplicationStatus"/> transitions.
/// Enforces valid workflow progressions for planning applications using a static transition map.
/// </summary>
public class PlanningStatusStateMachine : IPlanningStatusStateMachine
{
    private static readonly Dictionary<PlanningApplicationStatus, List<PlanningApplicationStatus>> TransitionMap = new()
    {
        { PlanningApplicationStatus.PreApplication, [PlanningApplicationStatus.Submitted] },
        { PlanningApplicationStatus.Submitted, [PlanningApplicationStatus.Validated, PlanningApplicationStatus.Withdrawn] },
        { PlanningApplicationStatus.Validated, [PlanningApplicationStatus.UnderReview, PlanningApplicationStatus.Withdrawn] },
        { PlanningApplicationStatus.UnderReview, [PlanningApplicationStatus.CommitteeReview, PlanningApplicationStatus.Approved, PlanningApplicationStatus.ApprovedWithConditions, PlanningApplicationStatus.Refused, PlanningApplicationStatus.Withdrawn] },
        { PlanningApplicationStatus.CommitteeReview, [PlanningApplicationStatus.Approved, PlanningApplicationStatus.ApprovedWithConditions, PlanningApplicationStatus.Refused, PlanningApplicationStatus.Withdrawn] },
        { PlanningApplicationStatus.Refused, [PlanningApplicationStatus.Appeal] },
        { PlanningApplicationStatus.Appeal, [PlanningApplicationStatus.Approved, PlanningApplicationStatus.ApprovedWithConditions, PlanningApplicationStatus.Refused] },
        { PlanningApplicationStatus.Approved, [] },
        { PlanningApplicationStatus.ApprovedWithConditions, [] },
        { PlanningApplicationStatus.Withdrawn, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(PlanningApplicationStatus from, PlanningApplicationStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<PlanningApplicationStatus> GetPermittedTransitions(PlanningApplicationStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<PlanningApplicationStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(PlanningApplicationStatus from, PlanningApplicationStatus to)
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
