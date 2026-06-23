using System.Security.Claims;
using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildEstate.Application.Features.Search.Services;

/// <summary>
/// Orchestrates parallel search across all registered providers, applies synonym expansion,
/// scoring, highlighting, result grouping, per-category limits, total limits, and provider priority ordering.
/// Handles per-provider timeouts gracefully, returning partial results when providers fail.
/// </summary>
public sealed class SearchAggregator : ISearchAggregator
{
    private readonly IEnumerable<ISearchProvider> _providers;
    private readonly ISearchScoringService _scoringService;
    private readonly ISearchSynonymService _synonymService;
    private readonly ISearchHighlightService _highlightService;
    private readonly IMemoryCache _cache;
    private readonly SearchSettings _settings;
    private readonly ILogger<SearchAggregator> _logger;

    private const string CategoryCountsCacheKeyPrefix = "search:counts:";

    public SearchAggregator(
        IEnumerable<ISearchProvider> providers,
        ISearchScoringService scoringService,
        ISearchSynonymService synonymService,
        ISearchHighlightService highlightService,
        IOptions<SearchSettings> settings,
        IMemoryCache cache,
        ILogger<SearchAggregator> logger)
    {
        _providers = providers;
        _scoringService = scoringService;
        _synonymService = synonymService;
        _highlightService = highlightService;
        _settings = settings.Value;
        _cache = cache;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<AggregatedSearchResponse> ExecuteSearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var normalizedQuery = SearchNormalizationService.Normalize(request.Query);

        if (string.IsNullOrWhiteSpace(normalizedQuery))
        {
            return new AggregatedSearchResponse
            {
                Categories = [],
                TotalCount = 0,
                TimedOutModules = [],
                Query = request.Query
            };
        }

        // Try to retrieve cached category counts for this user+query combination
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? user.FindFirst("sub")?.Value
                     ?? string.Empty;

        var cacheKey = BuildCategoryCacheKey(userId, normalizedQuery, request.Modules);

        if (_cache.TryGetValue<AggregatedSearchResponse>(cacheKey, out var cachedResponse) && cachedResponse is not null)
        {
            _logger.LogDebug(
                "Returning cached search response for user '{UserId}', query '{Query}'",
                userId, normalizedQuery);
            return cachedResponse;
        }

        // Expand query with synonyms before scoring
        var expandedTerms = _synonymService.IsEnabled
            ? _synonymService.ExpandQuery(normalizedQuery)
            : new List<string> { normalizedQuery };

        // Build the expanded query string for scoring (join original + synonyms)
        var expandedQuery = expandedTerms.Count > 1
            ? string.Join(' ', expandedTerms)
            : normalizedQuery;

        // Select applicable providers (filter by requested modules when specified)
        var applicableProviders = request.Modules?.Count > 0
            ? _providers.Where(p => request.Modules.Contains(p.ModuleId, StringComparer.OrdinalIgnoreCase))
            : _providers;

        var providerList = applicableProviders.ToList();

        if (providerList.Count == 0)
        {
            return new AggregatedSearchResponse
            {
                Categories = [],
                TotalCount = 0,
                TimedOutModules = [],
                Query = request.Query
            };
        }

        // Execute providers in parallel with per-provider timeout
        var providerTasks = providerList.Select(provider =>
            ExecuteProviderWithTimeoutAsync(provider, request, user, cancellationToken));

        var results = await Task.WhenAll(providerTasks);

        // Identify timed-out providers
        var timedOutModules = results
            .Where(r => r.IsTimedOut)
            .Select(r => r.ModuleId)
            .ToList();

        if (timedOutModules.Count > 0)
        {
            _logger.LogWarning(
                "Search providers timed out for query '{Query}': {TimedOutModules}",
                request.Query, string.Join(", ", timedOutModules));
        }

        // Aggregate all raw results from non-timed-out providers
        var allRawResults = results
            .Where(r => !r.IsTimedOut)
            .SelectMany(r => r.Results)
            .ToList();

        // Score results using the expanded query
        var boostContext = BuildBoostContext(user);
        var scoredResults = _scoringService.ScoreResults(allRawResults, expandedQuery, boostContext);

        // Build a lookup of category → provider metadata for priority and icon
        var providerMetadata = providerList.ToDictionary(
            p => p.CategoryName,
            p => (p.Priority, p.Icon),
            StringComparer.OrdinalIgnoreCase);

        // Also gather metadata from result providers that returned results
        foreach (var result in results.Where(r => !r.IsTimedOut && !string.IsNullOrEmpty(r.CategoryName)))
        {
            providerMetadata.TryAdd(result.CategoryName, (result.Priority, result.Icon));
        }

        // Group by category, limit per category (max 50), limit total (max 200)
        var maxPerCategory = Math.Min(request.MaxPerCategory, _settings.MaxResultsPerCategory);
        var maxTotal = _settings.MaxTotalResults;

        var grouped = scoredResults
            .GroupBy(r => r.Category, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var (priority, icon) = providerMetadata.TryGetValue(g.Key, out var meta)
                    ? meta
                    : (99, "search");

                var categoryResults = g.Take(maxPerCategory).ToList();

                return new SearchCategoryDto
                {
                    Category = g.Key,
                    Icon = icon,
                    Priority = priority,
                    TotalCount = g.Count(),
                    Results = categoryResults.Select(scored => MapToResultDto(scored, normalizedQuery)).ToList()
                };
            })
            .OrderBy(c => c.Priority)
            .ToList();

        // Apply total result limit across all categories
        var totalResultsIncluded = 0;
        var limitedCategories = new List<SearchCategoryDto>();

        foreach (var category in grouped)
        {
            if (totalResultsIncluded >= maxTotal)
                break;

            var remainingBudget = maxTotal - totalResultsIncluded;
            if (category.Results.Count <= remainingBudget)
            {
                limitedCategories.Add(category);
                totalResultsIncluded += category.Results.Count;
            }
            else
            {
                // Trim this category to fit within total budget
                limitedCategories.Add(category with
                {
                    Results = category.Results.Take(remainingBudget).ToList()
                });
                totalResultsIncluded += remainingBudget;
            }
        }

        var response = new AggregatedSearchResponse
        {
            Categories = limitedCategories,
            TotalCount = scoredResults.Count,
            TimedOutModules = timedOutModules,
            Query = request.Query
        };

        // Cache the response (including category counts) with configured TTL
        var cacheTtl = TimeSpan.FromSeconds(_settings.CategoryCountCacheTtlSeconds);
        _cache.Set(cacheKey, response, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = cacheTtl
        });

        return response;
    }

    /// <summary>
    /// Executes a single search provider with a per-provider timeout.
    /// Returns a timed-out result on cancellation rather than throwing.
    /// </summary>
    private async Task<SearchProviderResult> ExecuteProviderWithTimeoutAsync(
        ISearchProvider provider,
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(_settings.ProviderTimeoutMs);

        try
        {
            var result = await provider.SearchAsync(request, user, timeoutCts.Token);

            // Enrich the result with provider metadata
            result.ModuleId = provider.ModuleId;
            result.CategoryName = provider.CategoryName;
            result.Icon = provider.Icon;
            result.Priority = provider.Priority;

            return result;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // Provider-specific timeout (not a global cancellation)
            _logger.LogWarning(
                "Search provider '{ModuleId}' ({EntityName}) timed out after {TimeoutMs}ms",
                provider.ModuleId, provider.EntityName, _settings.ProviderTimeoutMs);

            return SearchProviderResult.TimedOut(provider.ModuleId);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Provider threw an unexpected exception — treat as empty result
            _logger.LogError(ex,
                "Search provider '{ModuleId}' ({EntityName}) threw an unexpected exception",
                provider.ModuleId, provider.EntityName);

            return new SearchProviderResult
            {
                ModuleId = provider.ModuleId,
                CategoryName = provider.CategoryName,
                Icon = provider.Icon,
                Priority = provider.Priority,
                IsTimedOut = false,
                Results = [],
                TotalCount = 0
            };
        }
    }

    /// <summary>
    /// Maps a scored search result to the SearchResultDto with highlight generation.
    /// </summary>
    private SearchResultDto MapToResultDto(ScoredSearchResult scored, string normalizedQuery)
    {
        return new SearchResultDto
        {
            EntityId = scored.EntityId,
            EntityType = scored.EntityType,
            Title = scored.Title,
            HighlightedTitle = _highlightService.Highlight(scored.Title, normalizedQuery),
            Subtitle = scored.Subtitle,
            HighlightedSubtitle = _highlightService.Highlight(scored.Subtitle, normalizedQuery),
            Status = scored.Status,
            StatusVariant = scored.StatusVariant,
            Icon = scored.Icon,
            Category = scored.Category,
            ModuleBadge = scored.ModuleBadge,
            NavigationRoute = scored.NavigationRoute,
            LastUpdated = scored.ModifiedAt,
            Breadcrumb = scored.Breadcrumb,
            RelevancyScore = scored.Score,
            QuickActions = scored.RawResult.QuickActions
                .Select(qa => new QuickActionDto
                {
                    Label = qa.Label,
                    Icon = qa.Icon,
                    Route = qa.Route,
                    Action = qa.Action,
                    Permission = qa.Permission
                })
                .ToList()
        };
    }

    /// <summary>
    /// Builds boost context from the current user's claims.
    /// </summary>
    private static SearchBoostContext BuildBoostContext(ClaimsPrincipal user)
    {
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? user.FindFirst("sub")?.Value
                     ?? string.Empty;

        var department = user.FindFirst("department")?.Value;

        return new SearchBoostContext
        {
            CurrentUserId = userId,
            UserDepartment = department,
            RecentlyViewedIds = new HashSet<Guid>(),
            FrequentlyAccessedIds = new HashSet<Guid>()
        };
    }

    /// <summary>
    /// Builds a cache key for category counts based on the user ID, normalized query, and module filters.
    /// </summary>
    private static string BuildCategoryCacheKey(string userId, string normalizedQuery, IReadOnlyList<string>? modules)
    {
        var modulePart = modules is { Count: > 0 }
            ? string.Join(',', modules.OrderBy(m => m, StringComparer.OrdinalIgnoreCase))
            : "all";

        return $"{CategoryCountsCacheKeyPrefix}{userId}:{normalizedQuery}:{modulePart}";
    }
}
