namespace BuildEstate.Application.Features.Search.Models;

/// <summary>
/// Result returned by an individual search provider, containing raw results or a timeout indicator.
/// </summary>
public class SearchProviderResult
{
    /// <summary>The module ID of the provider that produced these results.</summary>
    public string ModuleId { get; set; } = string.Empty;

    /// <summary>The category name for grouping.</summary>
    public string CategoryName { get; set; } = string.Empty;

    /// <summary>The icon for this category.</summary>
    public string Icon { get; set; } = string.Empty;

    /// <summary>The priority for tab ordering.</summary>
    public int Priority { get; set; }

    /// <summary>Whether this provider timed out.</summary>
    public bool IsTimedOut { get; set; }

    /// <summary>The raw search results from this provider.</summary>
    public IReadOnlyList<RawSearchResult> Results { get; set; } = [];

    /// <summary>Total count of matching records (may exceed returned results).</summary>
    public int TotalCount { get; set; }

    /// <summary>Creates a timed-out result for the specified module.</summary>
    public static SearchProviderResult TimedOut(string moduleId) => new()
    {
        ModuleId = moduleId,
        IsTimedOut = true,
        Results = []
    };
}
