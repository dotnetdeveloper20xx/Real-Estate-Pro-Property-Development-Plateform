using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace BuildEstate.Application.Features.Search.Services;

/// <summary>
/// Provides query normalization utilities for the search system.
/// Normalizes input by lowercasing, trimming, collapsing whitespace,
/// removing diacritical marks, expanding abbreviations, and truncating to 200 characters.
/// </summary>
public static partial class SearchNormalizationService
{
    private const int MaxQueryLength = 200;

    /// <summary>
    /// Common abbreviation dictionary mapping short forms to their full expansions.
    /// Used to improve search recall by expanding known abbreviations in queries.
    /// </summary>
    private static readonly Dictionary<string, string> AbbreviationDictionary = new(StringComparer.OrdinalIgnoreCase)
    {
        ["app"] = "application",
        ["dev"] = "development",
        ["mgmt"] = "management",
        ["ref"] = "reference",
        ["dept"] = "department",
        ["acq"] = "acquisition",
        ["prop"] = "property",
        ["doc"] = "document",
        ["env"] = "environmental",
        ["fin"] = "financial",
        ["auth"] = "authority",
        ["cert"] = "certificate",
        ["insp"] = "inspection",
        ["maint"] = "maintenance",
        ["proj"] = "project"
    };

    /// <summary>
    /// Normalizes a search query by applying the following transformations in order:
    /// 1. Trim leading/trailing whitespace
    /// 2. Convert to lowercase (invariant)
    /// 3. Collapse multiple whitespace characters to a single space
    /// 4. Remove diacritical marks (é → e, ñ → n)
    /// 5. Expand known abbreviations to their full forms
    /// 6. Truncate to 200 characters maximum
    /// </summary>
    /// <param name="input">The raw search query input.</param>
    /// <returns>The normalized query string, or empty string if input is null/whitespace.</returns>
    public static string Normalize(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var result = input.Trim().ToLowerInvariant();
        result = CollapseSpaces(result);
        result = RemoveDiacritics(result);
        result = ExpandAbbreviations(result);
        result = result.Length > MaxQueryLength ? result[..MaxQueryLength].TrimEnd() : result;

        return result;
    }

    /// <summary>
    /// Expands known abbreviations in the query to their full forms.
    /// Only whole-word matches are expanded (e.g., "app" expands but "application" does not).
    /// </summary>
    /// <param name="query">The query string with collapsed spaces and removed diacritics.</param>
    /// <returns>The query with abbreviations expanded to full forms.</returns>
    public static string ExpandAbbreviations(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return query;

        var words = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var expanded = false;

        for (var i = 0; i < words.Length; i++)
        {
            if (AbbreviationDictionary.TryGetValue(words[i], out var fullForm))
            {
                words[i] = fullForm;
                expanded = true;
            }
        }

        return expanded ? string.Join(' ', words) : query;
    }

    /// <summary>
    /// Removes diacritical marks (accents) from characters, converting them to their base form.
    /// For example: é → e, ñ → n, ü → u.
    /// </summary>
    private static string RemoveDiacritics(string text)
    {
        var normalized = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);

        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    /// <summary>
    /// Collapses multiple consecutive whitespace characters into a single space.
    /// </summary>
    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();

    private static string CollapseSpaces(string text)
        => WhitespaceRegex().Replace(text, " ");
}
