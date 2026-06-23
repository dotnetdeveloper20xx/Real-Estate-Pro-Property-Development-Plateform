namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// Top-level search response DTO returned by the search API.
/// </summary>
public record SearchResponseDto
{
    public IReadOnlyList<SearchCategoryDto> Categories { get; init; } = [];
    public int TotalCount { get; init; }
    public IReadOnlyList<string> TimedOutModules { get; init; } = [];
    public string Query { get; init; } = string.Empty;
    public PaginationMeta Pagination { get; init; } = new();
}
