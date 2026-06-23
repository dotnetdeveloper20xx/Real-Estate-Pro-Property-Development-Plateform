using System.Net;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Options;

namespace BuildEstate.Application.Features.Search.Services;

/// <summary>
/// Generates server-side highlight markup by wrapping matched query tokens in &lt;mark&gt; elements.
/// Supports multi-token highlighting with overlapping interval merging.
/// All output text (both matched and non-matched) is HTML-encoded to prevent XSS.
/// Respects the EnableHighlights configuration flag.
/// </summary>
public sealed class SearchHighlightService : ISearchHighlightService
{
    private readonly SearchSettings _settings;

    public SearchHighlightService(IOptions<SearchSettings> settings)
    {
        _settings = settings.Value;
    }

    /// <inheritdoc />
    public string Highlight(string text, string normalizedQuery)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        // When highlights are disabled, return HTML-encoded plain text
        if (!_settings.EnableHighlights)
            return WebUtility.HtmlEncode(text);

        if (string.IsNullOrWhiteSpace(normalizedQuery))
            return WebUtility.HtmlEncode(text);

        var tokens = normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (tokens.Length == 0)
            return WebUtility.HtmlEncode(text);

        // Find all match intervals (case-insensitive)
        var intervals = FindMatchIntervals(text, tokens);

        if (intervals.Count == 0)
            return WebUtility.HtmlEncode(text);

        // Merge overlapping intervals
        var merged = MergeIntervals(intervals);

        // Build the highlighted output
        return BuildHighlightedOutput(text, merged);
    }

    /// <summary>
    /// Finds all occurrences of each token in the text (case-insensitive).
    /// Returns a list of (start, end) intervals where end is exclusive.
    /// </summary>
    private static List<(int Start, int End)> FindMatchIntervals(string text, string[] tokens)
    {
        var intervals = new List<(int Start, int End)>();
        var textLower = text.ToLowerInvariant();

        foreach (var token in tokens)
        {
            if (string.IsNullOrEmpty(token))
                continue;

            var tokenLower = token.ToLowerInvariant();
            var index = 0;

            while (index <= textLower.Length - tokenLower.Length)
            {
                var found = textLower.IndexOf(tokenLower, index, StringComparison.Ordinal);
                if (found < 0)
                    break;

                intervals.Add((found, found + tokenLower.Length));
                index = found + 1; // Move past to find overlapping matches from other tokens
            }
        }

        return intervals;
    }

    /// <summary>
    /// Merges overlapping or adjacent intervals into non-overlapping sorted intervals.
    /// </summary>
    private static List<(int Start, int End)> MergeIntervals(List<(int Start, int End)> intervals)
    {
        if (intervals.Count == 0)
            return intervals;

        intervals.Sort((a, b) => a.Start != b.Start ? a.Start.CompareTo(b.Start) : a.End.CompareTo(b.End));

        var merged = new List<(int Start, int End)> { intervals[0] };

        for (var i = 1; i < intervals.Count; i++)
        {
            var current = intervals[i];
            var last = merged[^1];

            if (current.Start <= last.End)
            {
                // Overlapping or adjacent — merge
                merged[^1] = (last.Start, Math.Max(last.End, current.End));
            }
            else
            {
                merged.Add(current);
            }
        }

        return merged;
    }

    /// <summary>
    /// Builds the final HTML output with matched portions wrapped in &lt;mark&gt; elements.
    /// Both matched and non-matched text is HTML-encoded.
    /// </summary>
    private static string BuildHighlightedOutput(string text, List<(int Start, int End)> mergedIntervals)
    {
        var sb = new System.Text.StringBuilder(text.Length * 2);
        var currentPos = 0;

        foreach (var (start, end) in mergedIntervals)
        {
            // Encode and append non-matched text before this interval
            if (currentPos < start)
            {
                sb.Append(WebUtility.HtmlEncode(text[currentPos..start]));
            }

            // Encode and wrap matched text in <mark> element
            sb.Append("<mark>");
            sb.Append(WebUtility.HtmlEncode(text[start..end]));
            sb.Append("</mark>");

            currentPos = end;
        }

        // Encode and append any remaining text after the last interval
        if (currentPos < text.Length)
        {
            sb.Append(WebUtility.HtmlEncode(text[currentPos..]));
        }

        return sb.ToString();
    }
}
