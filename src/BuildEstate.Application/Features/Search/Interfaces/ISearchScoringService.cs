using BuildEstate.Application.Features.Search.Models;

namespace BuildEstate.Application.Features.Search.Interfaces;

/// <summary>
/// Calculates relevancy scores for raw search results using layered matching strategies
/// (exact, starts-with, contains, token, fuzzy, phonetic, synonym) and boost rules.
/// </summary>
public interface ISearchScoringService
{
    /// <summary>
    /// Scores and ranks raw results against the normalized query with contextual boost factors.
    /// </summary>
    IReadOnlyList<ScoredSearchResult> ScoreResults(
        IReadOnlyList<RawSearchResult> rawResults,
        string normalizedQuery,
        SearchBoostContext boostContext);
}
