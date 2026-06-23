namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// DTO representing a user's pinned search result item.
/// </summary>
public record PinnedItemDto
{
    public Guid Id { get; init; }
    public Guid EntityId { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Subtitle { get; init; }
    public string Icon { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string NavigationRoute { get; init; } = string.Empty;
    public DateTime PinnedAt { get; init; }
}
