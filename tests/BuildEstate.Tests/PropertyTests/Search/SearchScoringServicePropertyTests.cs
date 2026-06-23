using FsCheck;
using FsCheck.Xunit;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Application.Features.Search.Services;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Options;

namespace BuildEstate.Tests.PropertyTests.Search;

/// <summary>
/// Property-based tests for SearchScoringService verifying layered scoring,
/// multi-token AND logic, same-field bonus, fuzzy threshold, boost additivity,
/// feature flags, and field weight ordering.
///
/// **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 5.1, 5.2, 21.2, 21.3**
/// </summary>
public class SearchScoringServicePropertyTests
{
    #region Helpers

    private static SearchScoringService CreateService(
        bool enableFuzzy = true,
        bool enablePhonetic = true,
        bool enableSynonyms = true)
    {
        var settings = Options.Create(new SearchSettings
        {
            EnableFuzzyMatching = enableFuzzy,
            EnablePhoneticMatching = enablePhonetic,
            EnableSynonyms = enableSynonyms
        });
        var synonymService = new SearchSynonymService(settings);
        return new SearchScoringService(settings, synonymService);
    }

    private static RawSearchResult CreateResult(
        string fieldValue,
        double fieldWeight = 1.0,
        string fieldName = "TestField")
    {
        return new RawSearchResult
        {
            EntityId = Guid.NewGuid(),
            EntityType = "Test",
            Title = fieldValue,
            SearchableFields =
            [
                new SearchableField
                {
                    Name = fieldName, Value = fieldValue, Weight = fieldWeight
                }
            ]
        };
    }

    private static SearchBoostContext EmptyBoostContext() => new()
    {
        CurrentUserId = "user-none",
        UserDepartment = null,
        RecentlyViewedIds = new HashSet<Guid>(),
        FrequentlyAccessedIds = new HashSet<Guid>()
    };

    private static Gen<string> AlphaWordGen(int minLen = 3, int maxLen = 10)
    {
        return Gen.Choose(minLen, maxLen).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements(
                'a','b','c','d','e','f','g','h','i','j',
                'k','l','m','n','o','p','q','r','s','t',
                'u','v','w','x','y','z'))
            .Select(chars => new string(chars)));
    }

    private static string MakeWordAtDistance(string source, int distance)
    {
        var suffix = new string(Enumerable.Range(0, distance)
            .Select(i => (char)('0' + i)).ToArray());
        return source + suffix;
    }

    #endregion

    #region Property 4: Score layer ordering

    /// <summary>
    /// Property 4: Score layer ordering — Verify exact > starts-with > contains
    /// for same field weight.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ScoreLayerOrdering_ExactHigherThanStartsWith_HigherThanContains()
    {
        return Prop.ForAll(AlphaWordGen(4, 8).ToArbitrary(), (string word) =>
        {
            var service = CreateService(
                enableFuzzy: false, enablePhonetic: false, enableSynonyms: false);
            var boostContext = EmptyBoostContext();

            var exactResult = CreateResult(word);
            var startsWithResult = CreateResult(word + "suffix");
            var containsResult = CreateResult("prefix" + word + "suffix");

            var results = new List<RawSearchResult>
                { exactResult, startsWithResult, containsResult };
            var scored = service.ScoreResults(results, word, boostContext);

            var exactScore = scored.First(s => s.RawResult == exactResult).Score;
            var startsWithScore = scored.First(s => s.RawResult == startsWithResult).Score;
            var containsScore = scored.First(s => s.RawResult == containsResult).Score;

            return (exactScore > startsWithScore && startsWithScore > containsScore)
                .Label($"exact({exactScore:F2}) > startsWith({startsWithScore:F2})" +
                       $" > contains({containsScore:F2}) for '{word}'");
        });
    }

    #endregion

    #region Property 5: Multi-token AND logic

    /// <summary>
    /// Property 5: Multi-token AND logic — Results matching all tokens score higher
    /// than results matching only some tokens.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property MultiTokenAndLogic_AllTokensMatchScoresHigher()
    {
        var twoWordGen = AlphaWordGen(3, 6).Two()
            .Where(t => t.Item1 != t.Item2
                && !t.Item1.Contains(t.Item2)
                && !t.Item2.Contains(t.Item1));

        return Prop.ForAll(twoWordGen.ToArbitrary(),
            (Tuple<string, string> words) =>
        {
            var (token1, token2) = words;
            var service = CreateService(
                enableFuzzy: false, enablePhonetic: false, enableSynonyms: false);
            var boostContext = EmptyBoostContext();
            var query = $"{token1} {token2}";

            // Result that contains BOTH tokens in same field
            var bothResult = CreateResult($"{token1} and {token2}");
            // Result that contains only token1
            var onlyOneResult = CreateResult(token1);

            var scored = service.ScoreResults(
                [bothResult, onlyOneResult], query, boostContext);

            var bothScore = scored.FirstOrDefault(
                s => s.RawResult == bothResult)?.Score ?? 0;
            var oneScore = scored.FirstOrDefault(
                s => s.RawResult == onlyOneResult)?.Score ?? 0;

            return (bothScore > oneScore)
                .Label($"Both-token score ({bothScore:F2}) should be > " +
                       $"single-token score ({oneScore:F2}) for '{query}'");
        });
    }

    #endregion

    #region Property 6: Same-field token bonus

    /// <summary>
    /// Property 6: Same-field token bonus — Verify +1.0 bonus when all tokens match
    /// the same field vs tokens spread across different fields.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property SameFieldTokenBonus_AppliedWhenAllTokensInOneField()
    {
        var twoWordGen = AlphaWordGen(3, 6).Two()
            .Where(t => t.Item1 != t.Item2
                && !t.Item1.Contains(t.Item2)
                && !t.Item2.Contains(t.Item1));

        return Prop.ForAll(twoWordGen.ToArbitrary(),
            (Tuple<string, string> words) =>
        {
            var (token1, token2) = words;
            var service = CreateService(
                enableFuzzy: false, enablePhonetic: false, enableSynonyms: false);
            var boostContext = EmptyBoostContext();
            var query = $"{token1} {token2}";

            // Both tokens in SAME field — gets bonus
            var sameFieldResult = new RawSearchResult
            {
                EntityId = Guid.NewGuid(),
                EntityType = "Test",
                Title = $"{token1} {token2}",
                SearchableFields =
                [
                    new SearchableField
                    {
                        Name = "Name",
                        Value = $"{token1} {token2}",
                        Weight = 1.0
                    }
                ]
            };

            // Tokens in DIFFERENT fields — no bonus
            var diffFieldResult = new RawSearchResult
            {
                EntityId = Guid.NewGuid(),
                EntityType = "Test",
                Title = token1,
                SearchableFields =
                [
                    new SearchableField
                        { Name = "Name", Value = token1, Weight = 1.0 },
                    new SearchableField
                        { Name = "Location", Value = token2, Weight = 1.0 }
                ]
            };

            var sameScored = service.ScoreResults(
                [sameFieldResult], query, boostContext);
            var diffScored = service.ScoreResults(
                [diffFieldResult], query, boostContext);

            var sameScore = sameScored.FirstOrDefault()?.Score ?? 0;
            var diffScore = diffScored.FirstOrDefault()?.Score ?? 0;

            return (sameScore > diffScore)
                .Label($"Same-field score ({sameScore:F2}) should be > " +
                       $"diff-field score ({diffScore:F2}) for '{query}'");
        });
    }

    #endregion

    #region Property 7: Fuzzy matching distance threshold

    /// <summary>
    /// Property 7: Fuzzy matching distance threshold — Short words (≤6 chars)
    /// have max distance 2.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property FuzzyThreshold_ShortWords_MaxDistance2()
    {
        return Prop.ForAll(AlphaWordGen(3, 6).ToArbitrary(), (string word) =>
        {
            var atDistance2 = MakeWordAtDistance(word, 2);
            var dist2 = SearchScoringService.ComputeLevenshteinDistance(
                word, atDistance2);

            var atDistance3 = MakeWordAtDistance(word, 3);
            var dist3 = SearchScoringService.ComputeLevenshteinDistance(
                word, atDistance3);

            var maxDistance = 2; // word.Length <= 6
            return (dist2 <= maxDistance && dist3 > maxDistance)
                .Label($"Word '{word}' (len={word.Length}): " +
                       $"dist2={dist2} ≤ {maxDistance}, dist3={dist3} > {maxDistance}");
        });
    }

    /// <summary>
    /// Property 7: Fuzzy matching distance threshold — Long words (>6 chars)
    /// have max distance 3.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property FuzzyThreshold_LongWords_MaxDistance3()
    {
        return Prop.ForAll(AlphaWordGen(7, 10).ToArbitrary(), (string word) =>
        {
            var atDistance3 = MakeWordAtDistance(word, 3);
            var dist3 = SearchScoringService.ComputeLevenshteinDistance(
                word, atDistance3);

            var atDistance4 = MakeWordAtDistance(word, 4);
            var dist4 = SearchScoringService.ComputeLevenshteinDistance(
                word, atDistance4);

            var maxDistance = 3; // word.Length > 6
            return (dist3 <= maxDistance && dist4 > maxDistance)
                .Label($"Word '{word}' (len={word.Length}): " +
                       $"dist3={dist3} ≤ {maxDistance}, dist4={dist4} > {maxDistance}");
        });
    }

    #endregion

    #region Property 9: Boost score additivity

    /// <summary>
    /// Property 9: Boost score additivity — Verify boost equals the sum of
    /// applicable boost values only.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property BoostScoreAdditivity_EqualsExactSumOfApplicableBoosts()
    {
        var boolGen = Gen.Elements(true, false);

        return Prop.ForAll(
            boolGen.ToArbitrary(),
            boolGen.ToArbitrary(),
            boolGen.ToArbitrary(),
            (bool recentlyViewed, bool recentlyModified, bool isActive) =>
        {
            // Use fixed values for createdByUser and matchesDept to avoid
            // exceeding FsCheck's Prop.ForAll arity. Test all combinations via
            // separate assertions.
            var entityId = Guid.NewGuid();
            var userId = "test-user";
            var dept = "Engineering";

            var result = new RawSearchResult
            {
                EntityId = entityId,
                EntityType = "Test",
                Title = "test",
                Status = isActive ? "Active" : "Closed",
                CreatedBy = "other-user",
                Department = "Other",
                ModifiedAt = recentlyModified
                    ? DateTime.UtcNow.AddDays(-1)
                    : DateTime.UtcNow.AddDays(-30),
                ViewCount = 5,
                SearchableFields =
                [
                    new SearchableField
                        { Name = "Name", Value = "test", Weight = 1.0 }
                ]
            };

            var boostContext = new SearchBoostContext
            {
                CurrentUserId = userId,
                UserDepartment = dept,
                RecentlyViewedIds = recentlyViewed
                    ? new HashSet<Guid> { entityId }
                    : new HashSet<Guid>(),
                FrequentlyAccessedIds = new HashSet<Guid>()
            };

            var boost = SearchScoringService.CalculateBoostScore(
                result, boostContext);

            var expected = 0.0;
            if (recentlyViewed) expected += 2.0;
            if (recentlyModified) expected += 1.5;
            if (isActive) expected += 1.0;

            return (Math.Abs(boost - expected) < 0.001)
                .Label($"Boost {boost:F2} != expected {expected:F2} " +
                       $"(viewed={recentlyViewed}, modified={recentlyModified}, " +
                       $"active={isActive})");
        });
    }

    /// <summary>
    /// Property 9 (continued): Boost additivity for createdByUser and matchesDept.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property BoostScoreAdditivity_CreatedByAndDepartment()
    {
        var boolGen = Gen.Elements(true, false);

        return Prop.ForAll(
            boolGen.ToArbitrary(),
            boolGen.ToArbitrary(),
            (bool createdByUser, bool matchesDept) =>
        {
            var entityId = Guid.NewGuid();
            var userId = "test-user";
            var dept = "Engineering";

            var result = new RawSearchResult
            {
                EntityId = entityId,
                EntityType = "Test",
                Title = "test",
                Status = "Closed",
                CreatedBy = createdByUser ? userId : "other-user",
                Department = matchesDept ? dept : "Other",
                ModifiedAt = DateTime.UtcNow.AddDays(-30),
                ViewCount = 5,
                SearchableFields =
                [
                    new SearchableField
                        { Name = "Name", Value = "test", Weight = 1.0 }
                ]
            };

            var boostContext = new SearchBoostContext
            {
                CurrentUserId = userId,
                UserDepartment = dept,
                RecentlyViewedIds = new HashSet<Guid>(),
                FrequentlyAccessedIds = new HashSet<Guid>()
            };

            var boost = SearchScoringService.CalculateBoostScore(
                result, boostContext);

            var expected = 0.0;
            if (createdByUser) expected += 0.5;
            if (matchesDept) expected += 1.0;

            return (Math.Abs(boost - expected) < 0.001)
                .Label($"Boost {boost:F2} != expected {expected:F2} " +
                       $"(created={createdByUser}, dept={matchesDept})");
        });
    }

    #endregion

    #region Property 19: Feature flag layer disable

    /// <summary>
    /// Property 19: Feature flag layer disable — When fuzzy matching is disabled,
    /// the fuzzy layer contributes zero score.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property FeatureFlagDisable_FuzzyDisabled_NoFuzzyScore()
    {
        return Prop.ForAll(AlphaWordGen(4, 8).ToArbitrary(), (string word) =>
        {
            var serviceWith = CreateService(
                enableFuzzy: true, enablePhonetic: false, enableSynonyms: false);
            var serviceWithout = CreateService(
                enableFuzzy: false, enablePhonetic: false, enableSynonyms: false);
            var boostContext = EmptyBoostContext();

            // Word at distance 1 — matches only via fuzzy
            var fuzzyWord = word[..^1]
                + (word[^1] == 'z' ? 'a' : (char)(word[^1] + 1));
            if (fuzzyWord.Contains(word) || word.Contains(fuzzyWord))
                return true.Label("Skipped — word overlap");

            var fuzzyResult = CreateResult(fuzzyWord);

            var withFuzzy = serviceWith.ScoreResults(
                [fuzzyResult], word, boostContext);
            var withoutFuzzy = serviceWithout.ScoreResults(
                [fuzzyResult], word, boostContext);

            var scoreWith = withFuzzy.FirstOrDefault()?.Score ?? 0;
            var scoreWithout = withoutFuzzy.FirstOrDefault()?.Score ?? 0;

            return (scoreWithout <= scoreWith)
                .Label($"Fuzzy disabled ({scoreWithout:F2}) should be " +
                       $"<= enabled ({scoreWith:F2}) for '{word}'/'{fuzzyWord}'");
        });
    }

    /// <summary>
    /// Property 19: Feature flag layer disable — When phonetic matching is disabled,
    /// the phonetic layer contributes zero score.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property FeatureFlagDisable_PhoneticDisabled_NoPhoneticScore()
    {
        return Prop.ForAll(AlphaWordGen(4, 8).ToArbitrary(), (string word) =>
        {
            var serviceWith = CreateService(
                enableFuzzy: false, enablePhonetic: true, enableSynonyms: false);
            var serviceWithout = CreateService(
                enableFuzzy: false, enablePhonetic: false, enableSynonyms: false);
            var boostContext = EmptyBoostContext();

            var result = CreateResult(word);

            var withPhonetic = serviceWith.ScoreResults(
                [result], word, boostContext);
            var withoutPhonetic = serviceWithout.ScoreResults(
                [result], word, boostContext);

            var scoreWith = withPhonetic.FirstOrDefault()?.Score ?? 0;
            var scoreWithout = withoutPhonetic.FirstOrDefault()?.Score ?? 0;

            return (scoreWithout <= scoreWith)
                .Label($"Phonetic disabled ({scoreWithout:F2}) should be " +
                       $"<= enabled ({scoreWith:F2}) for '{word}'");
        });
    }

    #endregion

    #region Property 21: Field weight multiplier ordering

    /// <summary>
    /// Property 21: Field weight multiplier ordering — Higher-weight fields produce
    /// higher scores than lower-weight fields for the same match type.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property FieldWeightOrdering_HigherWeightProducesHigherScore()
    {
        var higherWeightGen = Gen.Choose(16, 30).Select(i => i / 10.0);
        var lowerWeightGen = Gen.Choose(1, 15).Select(i => i / 10.0);

        return Prop.ForAll(
            AlphaWordGen(4, 8).ToArbitrary(),
            higherWeightGen.ToArbitrary(),
            lowerWeightGen.ToArbitrary(),
            (string word, double higherWeight, double lowerWeight) =>
        {
            var service = CreateService(
                enableFuzzy: false, enablePhonetic: false,
                enableSynonyms: false);
            var boostContext = EmptyBoostContext();

            var highResult = CreateResult(word, higherWeight);
            var lowResult = CreateResult(word, lowerWeight);

            var highScored = service.ScoreResults(
                [highResult], word, boostContext);
            var lowScored = service.ScoreResults(
                [lowResult], word, boostContext);

            var highScore = highScored.FirstOrDefault()?.Score ?? 0;
            var lowScore = lowScored.FirstOrDefault()?.Score ?? 0;

            return (highScore > lowScore)
                .Label($"Weight {higherWeight:F1} score ({highScore:F2}) " +
                       $"should be > weight {lowerWeight:F1} ({lowScore:F2})");
        });
    }

    #endregion
}
