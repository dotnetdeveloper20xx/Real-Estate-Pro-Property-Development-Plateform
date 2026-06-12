using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Services.LegalCompliance;

/// <summary>
/// Implements the state machine for <see cref="LegalContractStatus"/> transitions.
/// Enforces valid workflow progressions for legal contracts using a static transition map.
/// </summary>
public class LegalContractStateMachine : ILegalContractStateMachine
{
    private static readonly Dictionary<LegalContractStatus, List<LegalContractStatus>> TransitionMap = new()
    {
        { LegalContractStatus.Draft, [LegalContractStatus.UnderReview, LegalContractStatus.Cancelled] },
        { LegalContractStatus.UnderReview, [LegalContractStatus.Approved, LegalContractStatus.Rejected, LegalContractStatus.Draft] },
        { LegalContractStatus.Approved, [LegalContractStatus.AwaitingSignature] },
        { LegalContractStatus.AwaitingSignature, [LegalContractStatus.Executed, LegalContractStatus.Cancelled] },
        { LegalContractStatus.Executed, [LegalContractStatus.Active] },
        { LegalContractStatus.Active, [LegalContractStatus.Completed, LegalContractStatus.Terminated, LegalContractStatus.Expired, LegalContractStatus.UnderDispute] },
        { LegalContractStatus.UnderDispute, [LegalContractStatus.Active, LegalContractStatus.Terminated] },
        { LegalContractStatus.Terminated, [LegalContractStatus.Closed] },
        { LegalContractStatus.Completed, [LegalContractStatus.Closed] },
        { LegalContractStatus.Expired, [LegalContractStatus.Renewed, LegalContractStatus.Closed] },
        { LegalContractStatus.Renewed, [LegalContractStatus.Active] },
        { LegalContractStatus.Cancelled, [LegalContractStatus.Closed] },
        { LegalContractStatus.Rejected, [] },
        { LegalContractStatus.Closed, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(LegalContractStatus from, LegalContractStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<LegalContractStatus> GetPermittedTransitions(LegalContractStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<LegalContractStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(LegalContractStatus from, LegalContractStatus to)
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
            "Contract");
    }
}
