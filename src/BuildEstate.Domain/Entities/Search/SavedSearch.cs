using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Entities.Search;

/// <summary>
/// Represents a user-defined search preset with query text and filter configuration persisted for reuse.
/// </summary>
public class SavedSearch : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Query { get; set; } = string.Empty;
    public string FiltersJson { get; set; } = "{}";
    public DateTime SavedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}
