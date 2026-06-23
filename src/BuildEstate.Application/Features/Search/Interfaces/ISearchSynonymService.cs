namespace BuildEstate.Application.Features.Search.Interfaces;

/// <summary>
/// Expands search queries with predefined synonym terms from the synonym dictionary
/// to improve recall for alternative terminology.
/// </summary>
public interface ISearchSynonymService
{
    /// <summary>
    /// Expands the query by adding synonym terms for any matching dictionary keys.
    /// </summary>
    IReadOnlyList<string> ExpandQuery(string query);

    /// <summary>
    /// Indicates whether synonym expansion is enabled (tied to SearchSettings.EnableSynonyms).
    /// </summary>
    bool IsEnabled { get; }
}
