using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Implements the state machine for <see cref="PaymentStatus"/> transitions on planning fees.
/// Enforces valid workflow progressions for fee payment statuses using a static transition map.
/// Note: Fee threshold enforcement (amounts above threshold cannot go Pending → Paid directly)
/// is handled in the command handler, not in this state machine. The state machine only knows
/// the raw transitions.
/// </summary>
public class FeeStatusStateMachine : IFeeStatusStateMachine
{
    private static readonly Dictionary<PaymentStatus, List<PaymentStatus>> TransitionMap = new()
    {
        { PaymentStatus.Pending, [PaymentStatus.AwaitingApproval, PaymentStatus.Paid] },
        { PaymentStatus.AwaitingApproval, [PaymentStatus.Approved, PaymentStatus.Rejected] },
        { PaymentStatus.Approved, [PaymentStatus.Paid] },
        { PaymentStatus.Rejected, [PaymentStatus.Pending] },
        { PaymentStatus.Paid, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(PaymentStatus from, PaymentStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<PaymentStatus> GetPermittedTransitions(PaymentStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<PaymentStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(PaymentStatus from, PaymentStatus to)
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
