namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// DTO representing a user's saved search preset.
/// </summary>
public record SavedSearchDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Query { get; init; } = string.Empty;
    public string FiltersJson { get; init; } = "{}";
    public DateTime SavedAt { get; init; }
    public DateTime? LastUsedAt { get; init; }
}
