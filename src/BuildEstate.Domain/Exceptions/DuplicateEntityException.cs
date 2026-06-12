namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when uniqueness constraints are violated for an entity.
/// Includes the entity type, the field that must be unique, and the duplicate value.
/// </summary>
public class DuplicateEntityException : DomainException
{
    public string EntityType { get; }
    public string DuplicateField { get; }
    public string DuplicateValue { get; }

    public DuplicateEntityException(string entityType, string duplicateField, string duplicateValue)
        : base($"A '{entityType}' with '{duplicateField}' = '{duplicateValue}' already exists.")
    {
        EntityType = entityType;
        DuplicateField = duplicateField;
        DuplicateValue = duplicateValue;
    }

    /// <summary>
    /// Backward-compatible constructor without duplicateValue (defaults to empty string).
    /// </summary>
    public DuplicateEntityException(string entityType, string duplicateField)
        : this(entityType, duplicateField, string.Empty)
    {
    }

    public DuplicateEntityException(string entityType, string duplicateField, string duplicateValue, Exception innerException)
        : base($"A '{entityType}' with '{duplicateField}' = '{duplicateValue}' already exists.", innerException)
    {
        EntityType = entityType;
        DuplicateField = duplicateField;
        DuplicateValue = duplicateValue;
    }
}
