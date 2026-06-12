namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when a referenced entity cannot be found by its identifier.
/// Includes the entity type and the identifier that was searched for.
/// </summary>
public class EntityNotFoundException : DomainException
{
    public string EntityType { get; }
    public string EntityId { get; }

    public EntityNotFoundException(string entityType, Guid entityId)
        : base($"Entity '{entityType}' with identifier '{entityId}' was not found.")
    {
        EntityType = entityType;
        EntityId = entityId.ToString();
    }

    public EntityNotFoundException(string entityType, string entityId)
        : base($"Entity '{entityType}' with identifier '{entityId}' was not found.")
    {
        EntityType = entityType;
        EntityId = entityId;
    }

    public EntityNotFoundException(string entityType, Guid entityId, Exception innerException)
        : base($"Entity '{entityType}' with identifier '{entityId}' was not found.", innerException)
    {
        EntityType = entityType;
        EntityId = entityId.ToString();
    }

    public EntityNotFoundException(string entityType, string entityId, Exception innerException)
        : base($"Entity '{entityType}' with identifier '{entityId}' was not found.", innerException)
    {
        EntityType = entityType;
        EntityId = entityId;
    }
}
