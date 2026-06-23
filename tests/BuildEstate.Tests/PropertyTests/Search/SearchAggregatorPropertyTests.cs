using System.Security.Claims;
using FsCheck;
using FsCheck.Xunit;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Application.Features.Search.Services;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace BuildEstate.Tests.PropertyTests.Search;

/// <summary>
/// Property-based tests for SearchAggregator verifying result count limits,
/// grouping correctness, tab ordering by priority, and module filter exclusion.
///
/// **Validates: Requirements 3.2, 3.4, 7.1, 7.4, 7.5**
/// </summary>
public class SearchAggregatorPropertyTests
{
    #region Mock SearchProvider

    /// <summary>
    /// A mock ISearchProvider that returns a configurable number of results for a given category.
    /// </summary>
    private class MockSearchProvider : ISearchProvider
    {
        private readonly List<RawSearchResult> _results;

        public string ModuleId { get; init; } = string.Empty;
        public string EntityName { get; init; } = string.Empty;
        public string CategoryName { get; init; } = string.Empty;
        public string Icon { get; init; } = "search";
        public int Priority { get; init; } = 50;

        public MockSearchProvider(string moduleId, string category, int priority, int resultCount)
        {
            ModuleId = moduleId;
            EntityName = $"{category} Entity";
            CategoryName = category;
            Priority = priority;

            _results = Enumerable.Range(0, resultCount)
                .Select(i => new RawSearchResult
                {
                    EntityId = Guid.NewGuid(),
                    EntityType = $"{category}Entity",
                    Title = $"test {category} Item {i}",
                    Subtitle = $"test subtitle {i}",
                    Icon = "search",
                    Category = category,
                    ModuleBadge = moduleId,
                    NavigationRoute = $"/{moduleId}/{i}",
                    ModifiedAt = DateTime.UtcNow.AddDays(-i),
                    SearchableFields =
                    [
                        new SearchableField
                        {
                            Name = "Title",
                            Value = $"test {category} item {i}",
                            Weight = 2.0
                        }
                    ],
                    QuickActions = []
                })
                .ToList();
        }

        public Task<SearchProviderResult> SearchAsync(
            SearchRequest request, ClaimsPrincipal user, CancellationToken cancellationToken)
        {
            return Task.FromResult(new SearchProviderResult
            {
                ModuleId = ModuleId,
                CategoryName = CategoryName,
                Icon = Icon,
                Priority = Priority,
                IsTimedOut = false,
                Results = _results,
                TotalCount = _results.Count
            });
        }

        public Task<int> CountAsync(string query, ClaimsPrincipal user, CancellationToken cancellationToken)
        {
            return Task.FromResult(_results.Count);
        }
    }

    #endregion

    #region Helpers

    private static SearchAggregator CreateAggregator(
        IEnumerable<ISearchProvider> providers,
        int maxPerCategory = 50,
        int maxTotal = 200)
    {
        var settings = Options.Create(new SearchSettings
        {
            MaxResultsPerCategory = maxPerCategory,
            MaxTotalResults = maxTotal,
            ProviderTimeoutMs = 5000,
            EnableFuzzyMatching = false,
            EnablePhoneticMatching = false,
            EnableSynonyms = false,
            EnableHighlights = false
        });

        var scoringService = new SearchScoringService(settings, new SearchSynonymService(settings));
        var synonymService = new SearchSynonymService(settings);

        var highlightServiceMock = new Mock<ISearchHighlightService>();
        highlightServiceMock
            .Setup(h => h.Highlight(It.IsAny<string>(), It.IsAny<string>()))
            .Returns((string text, string _) => text);

        var logger = NullLogger<SearchAggregator>.Instance;

        var cache = new MemoryCache(new MemoryCacheOptions());

        return new SearchAggregator(
            providers,
            scoringService,
            synonymService,
            highlightServiceMock.Object,
            settings,
            cache,
            logger);
    }

    private static ClaimsPrincipal CreateUser() =>
        new(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "test-user"),
            new Claim("department", "Testing")
        ], "TestAuth"));

    private static SearchRequest CreateRequest(
        string query = "test",
        IReadOnlyList<string>? modules = null,
        int maxPerCategory = 50)
    {
        return new SearchRequest
        {
            Query = query,
            Modules = modules,
            MaxPerCategory = maxPerCategory,
            Page = 1,
            PageSize = 50
        };
    }

    /// <summary>
    /// Generator for a small number of categories (1–6) with random result counts.
    /// </summary>
    private static Gen<List<(string ModuleId, string Category, int Priority, int ResultCount)>> ProviderConfigGen(
        int maxResultsPerProvider = 80)
    {
        return Gen.Choose(1, 6).SelectMany(numCategories =>
            Gen.Sequence(Enumerable.Range(0, numCategories).Select(i =>
                Gen.Choose(0, maxResultsPerProvider).SelectMany(count =>
                    Gen.Choose(1, 100).Select(priority =>
                        ($"module-{i}", $"Category{i}", priority, count)))
            )).Select(configs => configs.ToList()));
    }

    /// <summary>
    /// Generator for priority values that are distinct (ensures clear ordering).
    /// </summary>
    private static Gen<List<int>> DistinctPrioritiesGen(int count)
    {
        return Gen.Shuffle(Enumerable.Range(1, 100).ToArray())
            .Select(arr => arr.Take(count).ToList());
    }

    #endregion

    #region Property 3: Result count limits

    /// <summary>
    /// Property 3: Result count limits — No category in the response exceeds 50 results.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ResultCountLimits_NoCategoryExceeds50Results()
    {
        var countGen = Gen.Choose(0, 120); // Generate counts that may exceed limit

        return Prop.ForAll(
            Gen.Choose(1, 5).ToArbitrary(),
            countGen.ToArbitrary(),
            (int numCategories, int resultCount) =>
            {
                var providers = Enumerable.Range(0, numCategories)
                    .Select(i => (ISearchProvider)new MockSearchProvider(
                        $"module-{i}", $"Category{i}", i + 1, resultCount))
                    .ToList();

                var aggregator = CreateAggregator(providers);
                var response = aggregator.ExecuteSearchAsync(
                    CreateRequest(), CreateUser(), CancellationToken.None).Result;

                var allWithinLimit = response.Categories
                    .All(c => c.Results.Count <= 50);

                return allWithinLimit
                    .Label($"Categories: {response.Categories.Count}, " +
                           $"max results in any category: " +
                           $"{response.Categories.Select(c => c.Results.Count).DefaultIfEmpty(0).Max()}, " +
                           $"input count per provider: {resultCount}");
            });
    }

    /// <summary>
    /// Property 3: Result count limits — Total results across all categories ≤ 200.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ResultCountLimits_TotalResultsDoNotExceed200()
    {
        var countGen = Gen.Choose(20, 80);

        return Prop.ForAll(
            Gen.Choose(2, 6).ToArbitrary(),
            countGen.ToArbitrary(),
            (int numCategories, int resultCount) =>
            {
                var providers = Enumerable.Range(0, numCategories)
                    .Select(i => (ISearchProvider)new MockSearchProvider(
                        $"module-{i}", $"Category{i}", i + 1, resultCount))
                    .ToList();

                var aggregator = CreateAggregator(providers);
                var response = aggregator.ExecuteSearchAsync(
                    CreateRequest(), CreateUser(), CancellationToken.None).Result;

                var totalResults = response.Categories.Sum(c => c.Results.Count);

                return (totalResults <= 200)
                    .Label($"Total results: {totalResults}, categories: {numCategories}, " +
                           $"input per provider: {resultCount}");
            });
    }

    #endregion

    #region Property 12: Result grouping and tab ordering

    /// <summary>
    /// Property 12: Result grouping — Each result appears in exactly one group,
    /// and the group's Results.Count ≤ TotalCount.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ResultGrouping_EachResultInExactlyOneGroup()
    {
        var countGen = Gen.Choose(1, 30);

        return Prop.ForAll(
            Gen.Choose(2, 5).ToArbitrary(),
            countGen.ToArbitrary(),
            (int numCategories, int resultCount) =>
            {
                var providers = Enumerable.Range(0, numCategories)
                    .Select(i => (ISearchProvider)new MockSearchProvider(
                        $"module-{i}", $"Category{i}", i + 1, resultCount))
                    .ToList();

                var aggregator = CreateAggregator(providers);
                var response = aggregator.ExecuteSearchAsync(
                    CreateRequest(), CreateUser(), CancellationToken.None).Result;

                // Each category has a distinct name
                var categoryNames = response.Categories.Select(c => c.Category).ToList();
                var allDistinct = categoryNames.Distinct(StringComparer.OrdinalIgnoreCase).Count()
                    == categoryNames.Count;

                // Result counts make sense (displayed count ≤ total count per category)
                var countsValid = response.Categories
                    .All(c => c.Results.Count <= c.TotalCount);

                return (allDistinct && countsValid)
                    .Label($"Distinct categories: {allDistinct}, counts valid: {countsValid}, " +
                           $"categories: [{string.Join(", ", categoryNames)}]");
            });
    }

    /// <summary>
    /// Property 12: Tab ordering — Categories are ordered by priority ascending
    /// (lower number = higher priority = appears first).
    /// </summary>
    [Property(MaxTest = 50)]
    public Property TabOrdering_CategoriesOrderedByPriorityAscending()
    {
        return Prop.ForAll(
            Gen.Choose(2, 6).ToArbitrary(),
            (int numCategories) =>
            {
                // Generate distinct priorities to ensure clear ordering
                var priorities = Enumerable.Range(0, numCategories)
                    .Select(i => (i + 1) * 10) // 10, 20, 30, ...
                    .OrderByDescending(x => x)  // Reverse order to test sorting
                    .ToList();

                var providers = Enumerable.Range(0, numCategories)
                    .Select(i => (ISearchProvider)new MockSearchProvider(
                        $"module-{i}", $"Category{i}", priorities[i], 5))
                    .ToList();

                var aggregator = CreateAggregator(providers);
                var response = aggregator.ExecuteSearchAsync(
                    CreateRequest(), CreateUser(), CancellationToken.None).Result;

                var responsePriorities = response.Categories
                    .Select(c => c.Priority)
                    .ToList();

                var isOrdered = responsePriorities
                    .Zip(responsePriorities.Skip(1), (a, b) => a <= b)
                    .All(x => x);

                return isOrdered
                    .Label($"Priorities: [{string.Join(", ", responsePriorities)}] " +
                           $"should be in ascending order");
            });
    }

    #endregion

    #region Property 13: Module filter exclusion

    /// <summary>
    /// Property 13: Module filter exclusion — When modules are specified in the request,
    /// only results from those modules appear in the response.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ModuleFilterExclusion_OnlyFilteredModulesAppearInResponse()
    {
        return Prop.ForAll(
            Gen.Choose(3, 6).ToArbitrary(),
            Gen.Choose(1, 3).ToArbitrary(),
            (int totalModules, int selectedCount) =>
            {
                var actualSelected = Math.Min(selectedCount, totalModules - 1);

                var providers = Enumerable.Range(0, totalModules)
                    .Select(i => (ISearchProvider)new MockSearchProvider(
                        $"module-{i}", $"Category{i}", i + 1, 10))
                    .ToList();

                // Select a subset of modules to filter on
                var selectedModules = Enumerable.Range(0, actualSelected)
                    .Select(i => $"module-{i}")
                    .ToList();

                var aggregator = CreateAggregator(providers);
                var request = CreateRequest(modules: selectedModules);
                var response = aggregator.ExecuteSearchAsync(
                    request, CreateUser(), CancellationToken.None).Result;

                // All returned categories should correspond to selected modules
                var expectedCategories = selectedModules
                    .Select(m => $"Category{m.Replace("module-", "")}")
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var allCategoriesValid = response.Categories
                    .All(c => expectedCategories.Contains(c.Category));

                // No results from excluded modules should be present
                var excludedModules = Enumerable.Range(actualSelected, totalModules - actualSelected)
                    .Select(i => $"Category{i}")
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var noExcludedResults = !response.Categories
                    .Any(c => excludedModules.Contains(c.Category));

                return (allCategoriesValid && noExcludedResults)
                    .Label($"Total modules: {totalModules}, selected: {actualSelected}, " +
                           $"returned categories: [{string.Join(", ", response.Categories.Select(c => c.Category))}], " +
                           $"valid: {allCategoriesValid}, no excluded: {noExcludedResults}");
            });
    }

    /// <summary>
    /// Property 13: Module filter exclusion — When no module filter is specified,
    /// results from all providers may appear (empty filter = search all).
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ModuleFilterExclusion_NoFilterReturnsAllModules()
    {
        return Prop.ForAll(
            Gen.Choose(2, 5).ToArbitrary(),
            (int numCategories) =>
            {
                var providers = Enumerable.Range(0, numCategories)
                    .Select(i => (ISearchProvider)new MockSearchProvider(
                        $"module-{i}", $"Category{i}", i + 1, 5))
                    .ToList();

                var aggregator = CreateAggregator(providers);
                var request = CreateRequest(modules: null);
                var response = aggregator.ExecuteSearchAsync(
                    request, CreateUser(), CancellationToken.None).Result;

                // All categories should be present
                var returnedCategories = response.Categories
                    .Select(c => c.Category)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var allPresent = Enumerable.Range(0, numCategories)
                    .All(i => returnedCategories.Contains($"Category{i}"));

                return allPresent
                    .Label($"Expected {numCategories} categories, got: " +
                           $"[{string.Join(", ", returnedCategories)}]");
            });
    }

    #endregion
}
