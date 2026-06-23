namespace BuildEstate.Application.Features.Search.Interfaces;

/// <summary>
/// Generates server-side highlight markup by wrapping matched query tokens in &lt;mark&gt; elements.
/// All output is HTML-encoded to prevent XSS.
/// </summary>
public interface ISearchHighlightService
{
    /// <summary>
    /// Highlights occurrences of each token in the normalized query within the given text.
    /// Returns HTML-safe output with matched substrings wrapped in &lt;mark&gt; elements.
    /// When highlighting is disabled, returns HTML-encoded plain text.
    /// </summary>
    /// <param name="text">The raw text to highlight (may contain HTML special characters).</param>
    /// <param name="normalizedQuery">The normalized (lowercased, trimmed) search query.</param>
    /// <returns>HTML string with matches wrapped in mark elements and all text HTML-encoded.</returns>
    string Highlight(string text, string normalizedQuery);
}
