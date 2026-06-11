using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="ContractStatus"/> transitions.
/// Enforces valid workflow progressions for contracts using a static transition map.
/// </summary>
public class ContractStateMachine : IContractStateMachine
{
    private static readonly Dictionary<ContractStatus, List<ContractStatus>> TransitionMap = new()
    {
        { ContractStatus.Draft, [ContractStatus.UnderLegalReview] },
        { ContractStatus.UnderLegalReview, [ContractStatus.Approved, ContractStatus.Rejected] },
        { ContractStatus.Approved, [ContractStatus.Signed] },
        { ContractStatus.Rejected, [] },
        { ContractStatus.Signed, [ContractStatus.Exchanged] },
        { ContractStatus.Exchanged, [ContractStatus.Completed] },
        { ContractStatus.Completed, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(ContractStatus from, ContractStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<ContractStatus> GetPermittedTransitions(ContractStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<ContractStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(ContractStatus from, ContractStatus to)
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
