namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when an invalid state transition is attempted on an entity.
/// Includes the current state, the attempted state, and the list of permitted transitions.
/// </summary>
public class InvalidStateTransitionException : DomainException
{
    public string CurrentState { get; }
    public string AttemptedState { get; }
    public IReadOnlyList<string> PermittedTransitions { get; }

    public InvalidStateTransitionException(
        string currentState,
        string attemptedState,
        IReadOnlyList<string> permittedTransitions)
        : base(BuildMessage(currentState, attemptedState, permittedTransitions))
    {
        CurrentState = currentState;
        AttemptedState = attemptedState;
        PermittedTransitions = permittedTransitions;
    }

    public InvalidStateTransitionException(
        string currentState,
        string attemptedState,
        IReadOnlyList<string> permittedTransitions,
        Exception innerException)
        : base(BuildMessage(currentState, attemptedState, permittedTransitions), innerException)
    {
        CurrentState = currentState;
        AttemptedState = attemptedState;
        PermittedTransitions = permittedTransitions;
    }

    private static string BuildMessage(
        string currentState,
        string attemptedState,
        IReadOnlyList<string> permittedTransitions)
    {
        var permitted = permittedTransitions.Count > 0
            ? string.Join(", ", permittedTransitions)
            : "none";

        return $"Cannot transition from '{currentState}' to '{attemptedState}'. " +
               $"Permitted transitions from '{currentState}': [{permitted}].";
    }
}
