using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Entities.Search;

/// <summary>
/// Represents a search result pinned by a user for quick access across sessions.
/// </summary>
public class PinnedItem : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string NavigationRoute { get; set; } = string.Empty;
    public DateTime PinnedAt { get; set; }
}
