using System.Text.Json.Serialization;

namespace BuildEstate.Shared;

/// <summary>
/// Paginated collection with metadata for list endpoints.
/// </summary>
/// <typeparam name="T">The type of items in the paged collection.</typeparam>
public class PagedResult<T>
{
    [JsonPropertyName("items")]
    public List<T> Items { get; set; } = new();

    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// Creates a new PagedResult with validation.
    /// </summary>
    /// <param name="items">The items for the current page.</param>
    /// <param name="totalCount">Total number of items across all pages.</param>
    /// <param name="page">Current page number (must be >= 1).</param>
    /// <param name="pageSize">Number of items per page (must be >= 1 and <= 100).</param>
    /// <exception cref="ArgumentException">Thrown when page or pageSize is invalid.</exception>
    public static PagedResult<T> Create(List<T> items, int totalCount, int page, int pageSize)
    {
        if (page < 1)
            throw new ArgumentException("Page must be greater than or equal to 1.", nameof(page));

        if (pageSize < 1)
            throw new ArgumentException("PageSize must be greater than or equal to 1.", nameof(pageSize));

        if (pageSize > 100)
            throw new ArgumentException("PageSize must be less than or equal to 100.", nameof(pageSize));

        if (totalCount < 0)
            throw new ArgumentException("TotalCount must be greater than or equal to 0.", nameof(totalCount));

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// Parameterless constructor for deserialization. 
    /// Use <see cref="Create"/> factory for validated construction.
    /// </summary>
    public PagedResult() { }

    /// <summary>
    /// Constructor with validation.
    /// </summary>
    /// <param name="items">The items for the current page.</param>
    /// <param name="totalCount">Total number of items across all pages.</param>
    /// <param name="page">Current page number (must be >= 1).</param>
    /// <param name="pageSize">Number of items per page (must be >= 1 and <= 100).</param>
    /// <exception cref="ArgumentException">Thrown when page or pageSize is invalid.</exception>
    public PagedResult(List<T> items, int totalCount, int page, int pageSize)
    {
        if (page < 1)
            throw new ArgumentException("Page must be greater than or equal to 1.", nameof(page));

        if (pageSize < 1)
            throw new ArgumentException("PageSize must be greater than or equal to 1.", nameof(pageSize));

        if (pageSize > 100)
            throw new ArgumentException("PageSize must be less than or equal to 100.", nameof(pageSize));

        if (totalCount < 0)
            throw new ArgumentException("TotalCount must be greater than or equal to 0.", nameof(totalCount));

        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}
