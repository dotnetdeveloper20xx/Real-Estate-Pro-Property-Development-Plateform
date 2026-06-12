using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;

namespace BuildEstate.Infrastructure.Services.LegalCompliance;

/// <summary>
/// Implements the state machine for <see cref="AuditRecordStatus"/> transitions.
/// Enforces valid workflow progressions for audit records using a static transition map.
/// </summary>
public class AuditRecordStateMachine : IAuditRecordStateMachine
{
    private static readonly Dictionary<AuditRecordStatus, List<AuditRecordStatus>> TransitionMap = new()
    {
        { AuditRecordStatus.Planned, [AuditRecordStatus.InProgress] },
        { AuditRecordStatus.InProgress, [AuditRecordStatus.FindingsRecorded] },
        { AuditRecordStatus.FindingsRecorded, [AuditRecordStatus.ActionsRequired, AuditRecordStatus.Closed] },
        { AuditRecordStatus.ActionsRequired, [AuditRecordStatus.RemediationInProgress] },
        { AuditRecordStatus.RemediationInProgress, [AuditRecordStatus.Verified] },
        { AuditRecordStatus.Verified, [AuditRecordStatus.Closed] },
        { AuditRecordStatus.Closed, [] }
    };

    /// <inheritdoc />
    public bool CanTransition(AuditRecordStatus from, AuditRecordStatus to)
    {
        return TransitionMap.TryGetValue(from, out var permitted) && permitted.Contains(to);
    }

    /// <inheritdoc />
    public IReadOnlyList<AuditRecordStatus> GetPermittedTransitions(AuditRecordStatus current)
    {
        return TransitionMap.TryGetValue(current, out var permitted)
            ? permitted.AsReadOnly()
            : Array.Empty<AuditRecordStatus>();
    }

    /// <inheritdoc />
    public void ValidateTransition(AuditRecordStatus from, AuditRecordStatus to)
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
            "AuditRecord");
    }
}
