namespace BuildEstate.Application.Features.Search.Models;

/// <summary>
/// A search result that has been scored by the scoring service.
/// Wraps the raw result with a calculated relevancy score.
/// </summary>
public class ScoredSearchResult
{
    public ScoredSearchResult(RawSearchResult rawResult, double score)
    {
        RawResult = rawResult;
        Score = score;
    }

    /// <summary>The original raw search result from the provider.</summary>
    public RawSearchResult RawResult { get; }

    /// <summary>The calculated relevancy score (higher = more relevant).</summary>
    public double Score { get; }

    // Convenience properties delegated from raw result
    public Guid EntityId => RawResult.EntityId;
    public string EntityType => RawResult.EntityType;
    public string Title => RawResult.Title;
    public string Subtitle => RawResult.Subtitle;
    public string? Status => RawResult.Status;
    public string? StatusVariant => RawResult.StatusVariant;
    public string Icon => RawResult.Icon;
    public string Category => RawResult.Category;
    public string ModuleBadge => RawResult.ModuleBadge;
    public string NavigationRoute => RawResult.NavigationRoute;
    public DateTime ModifiedAt => RawResult.ModifiedAt;
    public string? Breadcrumb => RawResult.Breadcrumb;
}
