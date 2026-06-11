namespace BuildEstate.Domain.Common;

/// <summary>
/// Interface declaring the audit column contract for entities.
/// </summary>
public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    string CreatedBy { get; set; }
    DateTime? UpdatedAt { get; set; }
    string? UpdatedBy { get; set; }
}
