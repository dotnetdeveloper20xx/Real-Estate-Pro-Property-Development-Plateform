namespace BuildEstate.Application.Settings;

/// <summary>
/// Configuration settings for the Global Search feature, bound to the "Search" section in appsettings.json.
/// Controls result limits, timeouts, matching behaviour, and user-specific caps.
/// </summary>
public class SearchSettings
{
    public const string SectionName = "Search";

    /// <summary>Maximum results returned per category in a single response.</summary>
    public int MaxResultsPerCategory { get; set; } = 50;

    /// <summary>Maximum total results returned across all categories.</summary>
    public int MaxTotalResults { get; set; } = 200;

    /// <summary>Per-provider execution timeout in milliseconds.</summary>
    public int ProviderTimeoutMs { get; set; } = 5000;

    /// <summary>Default page size when not specified by the client.</summary>
    public int DefaultPageSize { get; set; } = 10;

    /// <summary>Maximum allowed page size.</summary>
    public int MaxPageSize { get; set; } = 50;

    /// <summary>Whether fuzzy matching (Levenshtein distance) is enabled.</summary>
    public bool EnableFuzzyMatching { get; set; } = true;

    /// <summary>Whether phonetic matching (Soundex/Metaphone) is enabled.</summary>
    public bool EnablePhoneticMatching { get; set; } = true;

    /// <summary>Whether synonym expansion is enabled.</summary>
    public bool EnableSynonyms { get; set; } = true;

    /// <summary>Whether match highlighting is enabled in results.</summary>
    public bool EnableHighlights { get; set; } = true;

    /// <summary>Maximum allowed query length in characters.</summary>
    public int MaxQueryLength { get; set; } = 200;

    /// <summary>Frontend debounce interval in milliseconds.</summary>
    public int DebounceMs { get; set; } = 300;

    /// <summary>Maximum number of autocomplete suggestions returned.</summary>
    public int SuggestionLimit { get; set; } = 8;

    /// <summary>Maximum number of recent searches stored per user.</summary>
    public int RecentSearchesLimit { get; set; } = 20;

    /// <summary>Maximum number of saved searches per user.</summary>
    public int MaxSavedSearches { get; set; } = 50;

    /// <summary>Maximum number of pinned items per user.</summary>
    public int MaxPinnedItems { get; set; } = 25;

    /// <summary>Cache TTL for category counts in seconds.</summary>
    public int CategoryCountCacheTtlSeconds { get; set; } = 30;

    /// <summary>Rate limit: maximum search requests per second per user.</summary>
    public int RateLimitPerSecond { get; set; } = 10;
}
