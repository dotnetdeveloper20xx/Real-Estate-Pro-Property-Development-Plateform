using BuildEstate.Application.Features.Search.DTOs;

namespace BuildEstate.Application.Features.Search.Models;

/// <summary>
/// The aggregated response from the search aggregator containing grouped, scored results
/// along with metadata about timed-out modules and the original query.
/// </summary>
public class AggregatedSearchResponse
{
    /// <summary>Results grouped by category, ordered by provider priority.</summary>
    public IReadOnlyList<SearchCategoryDto> Categories { get; set; } = [];

    /// <summary>Total count of all results across all categories.</summary>
    public int TotalCount { get; set; }

    /// <summary>Module IDs of providers that timed out during execution.</summary>
    public IReadOnlyList<string> TimedOutModules { get; set; } = [];

    /// <summary>The original query text submitted by the user.</summary>
    public string Query { get; set; } = string.Empty;
}
