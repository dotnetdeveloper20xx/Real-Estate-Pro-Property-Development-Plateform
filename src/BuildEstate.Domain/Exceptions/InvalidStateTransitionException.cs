namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when an invalid status transition is attempted on an entity.
/// Includes the current status, the attempted status, the entity type,
/// and the list of permitted transitions from the current status.
/// </summary>
public class InvalidStateTransitionException : DomainException
{
    public string CurrentStatus { get; }
    public string AttemptedStatus { get; }
    public IReadOnlyList<string> PermittedTransitions { get; }
    public string EntityType { get; }

    public InvalidStateTransitionException(
        string currentStatus,
        string attemptedStatus,
        IReadOnlyList<string> permittedTransitions,
        string entityType)
        : base(BuildMessage(currentStatus, attemptedStatus, permittedTransitions, entityType))
    {
        CurrentStatus = currentStatus;
        AttemptedStatus = attemptedStatus;
        PermittedTransitions = permittedTransitions;
        EntityType = entityType;
    }

    /// <summary>
    /// Backward-compatible constructor without entityType (defaults to empty string).
    /// </summary>
    public InvalidStateTransitionException(
        string currentStatus,
        string attemptedStatus,
        IReadOnlyList<string> permittedTransitions)
        : this(currentStatus, attemptedStatus, permittedTransitions, string.Empty)
    {
    }

    public InvalidStateTransitionException(
        string currentStatus,
        string attemptedStatus,
        IReadOnlyList<string> permittedTransitions,
        string entityType,
        Exception innerException)
        : base(BuildMessage(currentStatus, attemptedStatus, permittedTransitions, entityType), innerException)
    {
        CurrentStatus = currentStatus;
        AttemptedStatus = attemptedStatus;
        PermittedTransitions = permittedTransitions;
        EntityType = entityType;
    }

    private static string BuildMessage(
        string currentStatus,
        string attemptedStatus,
        IReadOnlyList<string> permittedTransitions,
        string entityType)
    {
        var permitted = permittedTransitions.Count > 0
            ? string.Join(", ", permittedTransitions)
            : "none";

        return string.IsNullOrEmpty(entityType)
            ? $"Invalid state transition from '{currentStatus}' to '{attemptedStatus}'. Permitted transitions: {permitted}"
            : $"Invalid state transition from '{currentStatus}' to '{attemptedStatus}' for entity type '{entityType}'. Permitted transitions: {permitted}";
    }
}
