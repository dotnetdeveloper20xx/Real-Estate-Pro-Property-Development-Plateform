namespace BuildEstate.Application.Features.Search.DTOs;

/// <summary>
/// Pagination metadata included in search responses.
/// </summary>
public record PaginationMeta
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public int TotalCount { get; init; }
    public int TotalPages { get; init; }
}
