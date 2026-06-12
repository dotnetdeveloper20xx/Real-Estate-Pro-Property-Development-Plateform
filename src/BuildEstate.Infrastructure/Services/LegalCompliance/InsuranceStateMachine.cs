using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Services.LegalCompliance;

/// <summary>
/// Implements the state machine for <see cref="InsuranceStatus"/> transitions.
/// Enforces valid workflow progressions for insurance records using a static transition map.
/// </summary>
public class InsuranceStateMachine : IInsuranceStateMachine
{
    private static readonly Dictionary<InsuranceStatus, List<InsuranceStatus>> TransitionMap = new()
    {
        { InsuranceStatus.Active, [InsuranceStatus.ExpiringSoon, InsuranceStatus.Cancelled] },
        { InsuranceStatus.ExpiringSoon, [InsuranceStatus.Renewed, InsuranceStatus.Expired, InsuranceStatus.Cancelled] },
        { InsuranceStatus.Expired, [InsuranceStatus.Renewed] },
        { InsuranceStatus.Renewed, [InsuranceStatus.Active] },
        { InsuranceStatus.Cancelled, [InsuranceStatus.Closed] },
        { InsuranceStatus.Closed, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(InsuranceStatus from, InsuranceStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<InsuranceStatus> GetPermittedTransitions(InsuranceStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<InsuranceStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(InsuranceStatus from, InsuranceStatus to)
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
            "InsuranceRecord");
    }
}
