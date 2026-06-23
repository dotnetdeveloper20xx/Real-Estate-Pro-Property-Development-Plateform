namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// Represents a quick action available on a search result card (View, Edit, Open in new tab, etc.).
/// </summary>
public record QuickActionDto
{
    public string Label { get; init; } = string.Empty;
    public string Icon { get; init; } = string.Empty;
    public string? Route { get; init; }
    public string? Action { get; init; }
    public string? Permission { get; init; }
}
