namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// Represents a single search result within a category, with scoring and highlighting.
/// </summary>
public record SearchResultDto
{
    public Guid EntityId { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? HighlightedTitle { get; init; }
    public string Subtitle { get; init; } = string.Empty;
    public string? HighlightedSubtitle { get; init; }
    public string? Status { get; init; }
    public string? StatusVariant { get; init; }
    public string Icon { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string ModuleBadge { get; init; } = string.Empty;
    public string NavigationRoute { get; init; } = string.Empty;
    public DateTime LastUpdated { get; init; }
    public string? Breadcrumb { get; init; }
    public double RelevancyScore { get; init; }
    public IReadOnlyList<QuickActionDto> QuickActions { get; init; } = [];
}
