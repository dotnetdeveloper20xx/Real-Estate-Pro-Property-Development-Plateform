namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// DTO representing a user's recent search entry.
/// </summary>
public record RecentSearchDto
{
    public Guid Id { get; init; }
    public string Query { get; init; } = string.Empty;
    public int ResultCount { get; init; }
    public DateTime SearchedAt { get; init; }
}
