namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when an action requires approval before it can proceed.
/// Includes the entity ID and the type of approval required.
/// </summary>
public class ApprovalRequiredException : DomainException
{
    public Guid EntityId { get; }
    public string ApprovalType { get; }

    public ApprovalRequiredException(Guid entityId, string approvalType)
        : base($"Action on entity '{entityId}' requires '{approvalType}' approval before proceeding.")
    {
        EntityId = entityId;
        ApprovalType = approvalType;
    }

    public ApprovalRequiredException(Guid entityId, string approvalType, Exception innerException)
        : base($"Action on entity '{entityId}' requires '{approvalType}' approval before proceeding.", innerException)
    {
        EntityId = entityId;
        ApprovalType = approvalType;
    }
}
