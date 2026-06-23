using BuildEstate.Application.Features.Search.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.Search.Queries.ExecuteSearch;

/// <summary>
/// MediatR query to execute a global search across all registered modules.
/// Properties match API query parameters for direct binding.
/// </summary>
public sealed record ExecuteSearchQuery : IRequest<SearchResponseDto>
{
    /// <summary>The search query text (1–200 characters).</summary>
    public string Query { get; init; } = string.Empty;

    /// <summary>Optional module filter — only query providers matching these module IDs.</summary>
    public List<string>? Modules { get; init; }

    /// <summary>Optional status filter for narrowing results.</summary>
    public List<string>? Statuses { get; init; }

    /// <summary>Optional date range start filter.</summary>
    public DateTime? DateFrom { get; init; }

    /// <summary>Optional date range end filter.</summary>
    public DateTime? DateTo { get; init; }

    /// <summary>Optional creator filter.</summary>
    public string? CreatedBy { get; init; }

    /// <summary>Current page number (1-based). Defaults to 1.</summary>
    public int Page { get; init; } = 1;

    /// <summary>Number of results per page (1–50). Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>Maximum results per category. Defaults to 50.</summary>
    public int MaxPerCategory { get; init; } = 50;
}
