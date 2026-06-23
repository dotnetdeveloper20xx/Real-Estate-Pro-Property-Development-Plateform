using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Options;

namespace BuildEstate.Application.Features.Search.Services;

/// <summary>
/// Calculates relevancy scores for raw search results using 7 layered matching strategies
/// (exact, starts-with, contains, token, fuzzy/Levenshtein, phonetic/Soundex, synonym)
/// and contextual boost rules.
/// </summary>
public sealed class SearchScoringService : ISearchScoringService
{
    // Layer multipliers (ordered by priority)
    private const double ExactMatchMultiplier = 5.0;
    private const double StartsWithMultiplier = 3.0;
    private const double ContainsMultiplier = 1.5;
    private const double TokenMatchMultiplier = 2.0;
    private const double FuzzyMatchMultiplier = 0.8;
    private const double PhoneticMatchMultiplier = 0.5;
    private const double SynonymMatchMultiplier = 0.7;
    private const double AllTokensSameFieldBonus = 1.0;

    // Boost rule values
    private const double RecentlyViewedBoost = 2.0;
    private const double RecentlyModifiedBoost = 1.5;
    private const double ActiveStatusBoost = 1.0;
    private const double CreatedByUserBoost = 0.5;
    private const double MatchesDepartmentBoost = 1.0;
    private const double FrequentlyAccessedBoost = 0.8;

    // Recently modified threshold
    private static readonly TimeSpan RecentlyModifiedThreshold = TimeSpan.FromDays(7);

    private readonly SearchSettings _settings;
    private readonly ISearchSynonymService _synonymService;

    public SearchScoringService(
        IOptions<SearchSettings> settings,
        ISearchSynonymService synonymService)
    {
        _settings = settings.Value;
        _synonymService = synonymService;
    }

    /// <inheritdoc />
    public IReadOnlyList<ScoredSearchResult> ScoreResults(
        IReadOnlyList<RawSearchResult> rawResults,
        string normalizedQuery,
        SearchBoostContext boostContext)
    {
        if (rawResults.Count == 0 || string.IsNullOrWhiteSpace(normalizedQuery))
            return [];

        var tokens = normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        // Expand query with synonyms for synonym matching layer
        var expandedTerms = _synonymService.IsEnabled
            ? _synonymService.ExpandQuery(normalizedQuery)
            : [];

        var scored = new List<ScoredSearchResult>(rawResults.Count);

        foreach (var raw in rawResults)
        {
            double totalScore = 0.0;
            var anyTokenMatchedInAnyField = false;
            var allTokensSameField = false;

            foreach (var field in raw.SearchableFields)
            {
                var normalizedField = SearchNormalizationService.Normalize(field.Value);

                if (string.IsNullOrWhiteSpace(normalizedField))
                    continue;

                var fieldScore = CalculateFieldScore(
                    normalizedQuery, tokens, normalizedField, field.Weight, expandedTerms);
                totalScore += fieldScore;

                // Check if all tokens match in this single field for same-field bonus
                if (tokens.Length > 1 && AllTokensMatchField(tokens, normalizedField))
                {
                    allTokensSameField = true;
                }

                if (fieldScore > 0)
                    anyTokenMatchedInAnyField = true;
            }

            // Apply all-tokens-same-field bonus
            if (allTokensSameField)
            {
                totalScore += AllTokensSameFieldBonus;
            }

            // Apply boost rules
            totalScore += CalculateBoostScore(raw, boostContext);

            // Only include results that actually matched something
            if (totalScore > 0 && anyTokenMatchedInAnyField)
            {
                scored.Add(new ScoredSearchResult(raw, totalScore));
            }
        }

        return scored.OrderByDescending(s => s.Score).ToList();
    }

    /// <summary>
    /// Calculates the score for a single field against the query using all matching layers.
    /// Layers: exact → starts-with → contains → token → fuzzy → phonetic → synonym.
    /// </summary>
    internal double CalculateFieldScore(
        string query,
        string[] tokens,
        string fieldValue,
        double fieldWeight,
        IReadOnlyList<string> expandedTerms)
    {
        double score = 0.0;

        // Layer 1: Exact match (full query matches full field value)
        if (string.Equals(fieldValue, query, StringComparison.Ordinal))
        {
            score += ExactMatchMultiplier * fieldWeight;
        }
        // Layer 2: Starts with (field value starts with the full query)
        else if (fieldValue.StartsWith(query, StringComparison.Ordinal))
        {
            score += StartsWithMultiplier * fieldWeight;
        }
        // Layer 3: Contains (field value contains the full query)
        else if (fieldValue.Contains(query, StringComparison.Ordinal))
        {
            score += ContainsMultiplier * fieldWeight;
        }

        // Layer 4: Token matching (individual tokens matched against field)
        var matchedTokenCount = 0;
        foreach (var token in tokens)
        {
            if (fieldValue.Contains(token, StringComparison.Ordinal))
            {
                matchedTokenCount++;
            }
        }

        if (matchedTokenCount > 0)
        {
            score += TokenMatchMultiplier * matchedTokenCount * fieldWeight;
        }

        // Layer 5: Fuzzy matching (Levenshtein distance)
        if (_settings.EnableFuzzyMatching)
        {
            foreach (var token in tokens)
            {
                var maxDistance = token.Length <= 6 ? 2 : 3;

                if (FieldContainsFuzzyToken(fieldValue, token, maxDistance))
                {
                    score += FuzzyMatchMultiplier * fieldWeight;
                }
            }
        }

        // Layer 6: Phonetic matching (Soundex)
        if (_settings.EnablePhoneticMatching)
        {
            var fieldWords = fieldValue.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            foreach (var token in tokens)
            {
                var tokenSoundex = ComputeSoundex(token);
                if (string.IsNullOrEmpty(tokenSoundex))
                    continue;

                foreach (var fieldWord in fieldWords)
                {
                    var fieldWordSoundex = ComputeSoundex(fieldWord);
                    if (!string.IsNullOrEmpty(fieldWordSoundex) &&
                        string.Equals(tokenSoundex, fieldWordSoundex, StringComparison.Ordinal))
                    {
                        score += PhoneticMatchMultiplier * fieldWeight;
                        break; // Only count once per token
                    }
                }
            }
        }

        // Layer 7: Synonym matching (expanded terms matched against field)
        if (_synonymService.IsEnabled && expandedTerms.Count > tokens.Length)
        {
            // Only check synonym-expanded terms (not the original tokens)
            foreach (var term in expandedTerms)
            {
                // Skip original tokens — they are already scored above
                if (tokens.Contains(term, StringComparer.Ordinal))
                    continue;

                if (fieldValue.Contains(term, StringComparison.Ordinal))
                {
                    score += SynonymMatchMultiplier * fieldWeight;
                }
            }
        }

        return score;
    }

    /// <summary>
    /// Calculates contextual boost score based on user activity and entity properties.
    /// </summary>
    internal static double CalculateBoostScore(RawSearchResult result, SearchBoostContext context)
    {
        double boost = 0.0;

        // Recently viewed by user (+2.0)
        if (context.RecentlyViewedIds.Contains(result.EntityId))
        {
            boost += RecentlyViewedBoost;
        }

        // Recently modified within 7 days (+1.5)
        if (result.ModifiedAt > DateTime.UtcNow - RecentlyModifiedThreshold)
        {
            boost += RecentlyModifiedBoost;
        }

        // Active status (+1.0)
        if (string.Equals(result.Status, "Active", StringComparison.OrdinalIgnoreCase))
        {
            boost += ActiveStatusBoost;
        }

        // Created by current user (+0.5)
        if (!string.IsNullOrEmpty(result.CreatedBy) &&
            string.Equals(result.CreatedBy, context.CurrentUserId, StringComparison.OrdinalIgnoreCase))
        {
            boost += CreatedByUserBoost;
        }

        // Matches user department (+1.0)
        if (!string.IsNullOrEmpty(result.Department) &&
            !string.IsNullOrEmpty(context.UserDepartment) &&
            string.Equals(result.Department, context.UserDepartment, StringComparison.OrdinalIgnoreCase))
        {
            boost += MatchesDepartmentBoost;
        }

        // Frequently accessed — 10+ views (+0.8)
        if (context.FrequentlyAccessedIds.Contains(result.EntityId))
        {
            boost += FrequentlyAccessedBoost;
        }

        return boost;
    }

    /// <summary>
    /// Checks if all query tokens match within a single field value.
    /// </summary>
    private static bool AllTokensMatchField(string[] tokens, string fieldValue)
    {
        foreach (var token in tokens)
        {
            if (!fieldValue.Contains(token, StringComparison.Ordinal))
                return false;
        }

        return true;
    }

    /// <summary>
    /// Checks whether any word in the field value is within the specified Levenshtein
    /// distance of the given token.
    /// </summary>
    private static bool FieldContainsFuzzyToken(string fieldValue, string token, int maxDistance)
    {
        // First check overall distance (for short field values)
        if (ComputeLevenshteinDistance(token, fieldValue) <= maxDistance)
            return true;

        // Check individual words in the field
        var fieldWords = fieldValue.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        foreach (var word in fieldWords)
        {
            if (ComputeLevenshteinDistance(token, word) <= maxDistance)
                return true;
        }

        return false;
    }

    /// <summary>
    /// Computes the Levenshtein (edit) distance between two strings using dynamic programming.
    /// The edit distance is the minimum number of single-character edits (insertions, deletions,
    /// or substitutions) required to change one string into the other.
    /// </summary>
    internal static int ComputeLevenshteinDistance(string source, string target)
    {
        if (string.IsNullOrEmpty(source))
            return target?.Length ?? 0;

        if (string.IsNullOrEmpty(target))
            return source.Length;

        var sourceLength = source.Length;
        var targetLength = target.Length;

        // Use single-row optimization for space efficiency
        var previousRow = new int[targetLength + 1];
        var currentRow = new int[targetLength + 1];

        // Initialize the first row
        for (var j = 0; j <= targetLength; j++)
        {
            previousRow[j] = j;
        }

        for (var i = 1; i <= sourceLength; i++)
        {
            currentRow[0] = i;

            for (var j = 1; j <= targetLength; j++)
            {
                var cost = source[i - 1] == target[j - 1] ? 0 : 1;

                currentRow[j] = Math.Min(
                    Math.Min(
                        currentRow[j - 1] + 1,      // Insertion
                        previousRow[j] + 1),        // Deletion
                    previousRow[j - 1] + cost);     // Substitution
            }

            // Swap rows
            (previousRow, currentRow) = (currentRow, previousRow);
        }

        return previousRow[targetLength];
    }

    /// <summary>
    /// Computes the Soundex code for a given word. Soundex is a phonetic algorithm that
    /// indexes words by their English pronunciation. The result is a letter followed by 3 digits.
    /// </summary>
    /// <param name="word">The word to compute the Soundex code for.</param>
    /// <returns>A 4-character Soundex code, or empty string if the word is null/empty or contains no letters.</returns>
    internal static string ComputeSoundex(string word)
    {
        if (string.IsNullOrWhiteSpace(word))
            return string.Empty;

        // Find the first letter
        var firstLetterIndex = -1;
        for (var i = 0; i < word.Length; i++)
        {
            if (char.IsLetter(word[i]))
            {
                firstLetterIndex = i;
                break;
            }
        }

        if (firstLetterIndex < 0)
            return string.Empty;

        var result = new char[4];
        result[0] = char.ToUpperInvariant(word[firstLetterIndex]);
        var lastDigit = GetSoundexDigit(result[0]);
        var count = 1;

        for (var i = firstLetterIndex + 1; i < word.Length && count < 4; i++)
        {
            var c = word[i];
            if (!char.IsLetter(c))
                continue;

            var digit = GetSoundexDigit(c);

            // Skip if same as last coded digit or if '0' (vowels/H/W/Y)
            if (digit == '0' || digit == lastDigit)
                continue;

            result[count] = digit;
            lastDigit = digit;
            count++;
        }

        // Pad with zeros
        while (count < 4)
        {
            result[count] = '0';
            count++;
        }

        return new string(result);
    }

    /// <summary>
    /// Maps a character to its Soundex digit according to the standard Soundex coding guide.
    /// </summary>
    private static char GetSoundexDigit(char c)
    {
        return char.ToUpperInvariant(c) switch
        {
            'B' or 'F' or 'P' or 'V' => '1',
            'C' or 'G' or 'J' or 'K' or 'Q' or 'S' or 'X' or 'Z' => '2',
            'D' or 'T' => '3',
            'L' => '4',
            'M' or 'N' => '5',
            'R' => '6',
            _ => '0' // A, E, I, O, U, H, W, Y
        };
    }
}
