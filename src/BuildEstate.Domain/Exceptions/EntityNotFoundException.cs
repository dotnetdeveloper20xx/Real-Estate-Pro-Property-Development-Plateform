namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when an entity cannot be found by its identifier.
/// Includes the entity name and the ID that was searched for.
/// </summary>
public class EntityNotFoundException : DomainException
{
    public string EntityName { get; }
    public Guid EntityId { get; }

    public EntityNotFoundException(string entityName, Guid entityId)
        : base($"Entity '{entityName}' with Id '{entityId}' was not found.")
    {
        EntityName = entityName;
        EntityId = entityId;
    }

    public EntityNotFoundException(string entityName, Guid entityId, Exception innerException)
        : base($"Entity '{entityName}' with Id '{entityId}' was not found.", innerException)
    {
        EntityName = entityName;
        EntityId = entityId;
    }
}
