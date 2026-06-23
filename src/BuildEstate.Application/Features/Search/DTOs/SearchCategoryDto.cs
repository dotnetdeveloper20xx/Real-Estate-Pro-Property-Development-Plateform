namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// Represents a group of search results within a single module category.
/// </summary>
public record SearchCategoryDto
{
    public string Category { get; init; } = string.Empty;
    public string Icon { get; init; } = string.Empty;
    public int Priority { get; init; }
    public int TotalCount { get; init; }
    public IReadOnlyList<SearchResultDto> Results { get; init; } = [];
}
