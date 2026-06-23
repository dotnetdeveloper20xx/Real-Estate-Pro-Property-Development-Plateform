namespace BuildEstate.Application.Features.Search.Models;

/// <summary>
/// Represents an inbound search request with query, filters, and pagination parameters.
/// </summary>
public class SearchRequest
{
    /// <summary>The normalized search query text.</summary>
    public string Query { get; set; } = string.Empty;

    /// <summary>Optional module filter — only query providers matching these module IDs.</summary>
    public IReadOnlyList<string>? Modules { get; set; }

    /// <summary>Optional status filter for narrowing results.</summary>
    public IReadOnlyList<string>? Statuses { get; set; }

    /// <summary>Optional date range start filter.</summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>Optional date range end filter.</summary>
    public DateTime? DateTo { get; set; }

    /// <summary>Optional creator filter.</summary>
    public string? CreatedBy { get; set; }

    /// <summary>Current page number (1-based).</summary>
    public int Page { get; set; } = 1;

    /// <summary>Number of results per page.</summary>
    public int PageSize { get; set; } = 10;

    /// <summary>Maximum results per category.</summary>
    public int MaxPerCategory { get; set; } = 50;
}
