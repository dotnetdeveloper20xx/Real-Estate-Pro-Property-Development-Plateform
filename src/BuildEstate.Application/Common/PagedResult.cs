namespace BuildEstate.Application.Common;

/// <summary>
/// Generic paginated result wrapper for list queries.
/// Contains items for the current page and pagination metadata.
/// </summary>
/// <typeparam name="T">The type of items in the paged collection.</typeparam>
public sealed record PagedResult<T>
{
    /// <summary>Items for the current page.</summary>
    public List<T> Items { get; init; } = new();

    /// <summary>Current page number (1-based).</summary>
    public int PageNumber { get; init; }

    /// <summary>Number of items per page.</summary>
    public int PageSize { get; init; }

    /// <summary>Total count of items across all pages.</summary>
    public int TotalCount { get; init; }

    /// <summary>Total number of pages based on TotalCount and PageSize.</summary>
    public int TotalPages => PageSize > 0
        ? (int)Math.Ceiling((double)TotalCount / PageSize)
        : 0;

    /// <summary>
    /// Factory method to create a validated PagedResult instance.
    /// </summary>
    public static PagedResult<T> Create(List<T> items, int totalCount, int pageNumber, int pageSize)
    {
        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}
