using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Services;

/// <summary>
/// Defines the state machine for <see cref="AuditRecordStatus"/> transitions.
/// Enforces valid workflow progressions for audit records.
/// </summary>
public interface IAuditRecordStateMachine
{
    /// <summary>
    /// Determines whether a transition from <paramref name="from"/> to <paramref name="to"/> is permitted.
    /// </summary>
    bool CanTransition(AuditRecordStatus from, AuditRecordStatus to);

    /// <summary>
    /// Returns the list of statuses that can be reached from <paramref name="current"/>.
    /// </summary>
    IReadOnlyList<AuditRecordStatus> GetPermittedTransitions(AuditRecordStatus current);

    /// <summary>
    /// Validates a transition and throws <see cref="Exceptions.InvalidStateTransitionException"/>
    /// if the transition is not allowed.
    /// </summary>
    void ValidateTransition(AuditRecordStatus from, AuditRecordStatus to);
}
