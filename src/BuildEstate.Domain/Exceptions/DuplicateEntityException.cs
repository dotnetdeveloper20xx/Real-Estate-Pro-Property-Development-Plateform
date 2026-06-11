namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when a duplicate entity is detected based on a unique business constraint
/// (e.g., duplicate Name + Location for an opportunity).
/// </summary>
public class DuplicateEntityException : DomainException
{
    public string EntityName { get; }
    public string DuplicateField { get; }

    public DuplicateEntityException(string entityName, string duplicateField)
        : base($"A duplicate '{entityName}' already exists with the same {duplicateField}.")
    {
        EntityName = entityName;
        DuplicateField = duplicateField;
    }

    public DuplicateEntityException(string entityName, string duplicateField, Exception innerException)
        : base($"A duplicate '{entityName}' already exists with the same {duplicateField}.", innerException)
    {
        EntityName = entityName;
        DuplicateField = duplicateField;
    }
}
