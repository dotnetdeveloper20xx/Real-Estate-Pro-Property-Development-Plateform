using FsCheck;
using FsCheck.Xunit;
using BuildEstate.Application.Features.Search.Services;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Options;

namespace BuildEstate.Tests.PropertyTests.Search;

/// <summary>
/// Property-based tests for SearchHighlightService verifying highlight wrapping correctness,
/// XSS-safe encoding, disable flag behaviour, and case preservation.
///
/// **Validates: Requirements 8.2, 8.3, 25.1, 25.2, 25.3**
/// </summary>
public class SearchHighlightServicePropertyTests
{
    #region Helpers

    private static SearchHighlightService CreateService(bool enableHighlights = true)
    {
        var settings = Options.Create(new SearchSettings
        {
            EnableHighlights = enableHighlights
        });
        return new SearchHighlightService(settings);
    }

    private static Gen<string> AlphaWordGen(int minLen = 2, int maxLen = 8)
    {
        return Gen.Choose(minLen, maxLen).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements(
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
                'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
                'u', 'v', 'w', 'x', 'y', 'z'))
            .Select(chars => new string(chars)));
    }

    private static Gen<string> HtmlSpecialCharGen()
    {
        return Gen.Elements("<", ">", "&", "\"", "'", "<script>", "a&b", "x<y>z");
    }

    /// <summary>
    /// Generates text that contains the given token (case-insensitive) at a random position,
    /// with possible HTML special chars around it.
    /// </summary>
    private static Gen<string> TextContainingToken(string token)
    {
        var prefixGen = Gen.Elements("", "prefix", "a<b", "x&y ", "hello ");
        var suffixGen = Gen.Elements("", " suffix", " c>d", " e\"f", " world");
        return prefixGen.SelectMany(prefix =>
            suffixGen.Select(suffix => prefix + token + suffix));
    }

    #endregion

    #region Property 10: Highlight wrapping correctness

    /// <summary>
    /// Property 10: Highlight wrapping correctness — All matching substrings of the query token
    /// are wrapped in &lt;mark&gt; elements in the output.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property HighlightWrappingCorrectness_MatchingSubstringsWrappedInMark()
    {
        return Prop.ForAll(
            AlphaWordGen(2, 6).ToArbitrary(),
            (string token) =>
        {
            var service = CreateService(enableHighlights: true);
            // Create text that definitely contains the token
            var text = "before " + token + " after";
            var result = service.Highlight(text, token);

            // The output must contain a <mark>...</mark> wrapping
            var encodedToken = System.Net.WebUtility.HtmlEncode(token);
            var expectedMark = $"<mark>{encodedToken}</mark>";

            return result.Contains(expectedMark)
                .Label($"Expected output to contain '{expectedMark}' but got: '{result}'");
        });
    }

    /// <summary>
    /// Property 10 (continued): Multiple occurrences of the token are all wrapped.
    /// Uses a numeric separator "---" that cannot overlap with alpha-only tokens.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property HighlightWrappingCorrectness_MultipleOccurrencesAllWrapped()
    {
        return Prop.ForAll(
            AlphaWordGen(2, 5).ToArbitrary(),
            Gen.Choose(2, 4).ToArbitrary(),
            (string token, int repetitions) =>
        {
            var service = CreateService(enableHighlights: true);
            // Use "---" as separator since it cannot overlap with alpha-only tokens
            var text = string.Join("---", Enumerable.Repeat(token, repetitions));
            var result = service.Highlight(text, token);

            // Count occurrences of <mark> opening tags in the output
            var markCount = 0;
            var idx = 0;
            while ((idx = result.IndexOf("<mark>", idx, StringComparison.Ordinal)) >= 0)
            {
                markCount++;
                idx += "<mark>".Length;
            }

            return (markCount == repetitions)
                .Label($"Expected {repetitions} <mark> tags, found {markCount} in: '{result}'");
        });
    }

    /// <summary>
    /// Property 10 (continued): Case-insensitive matching — token "abc" matches "ABC" in text.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property HighlightWrappingCorrectness_CaseInsensitiveMatching()
    {
        return Prop.ForAll(
            AlphaWordGen(2, 6).ToArbitrary(),
            (string token) =>
        {
            var service = CreateService(enableHighlights: true);
            // Use uppercase version in text, lowercase token in query
            var upperToken = token.ToUpperInvariant();
            var text = "start " + upperToken + " end";
            var result = service.Highlight(text, token.ToLowerInvariant());

            // The output should contain <mark> wrapping the original case
            return result.Contains("<mark>")
                .Label($"Expected case-insensitive match for '{token}' in '{text}', got: '{result}'");
        });
    }

    #endregion

    #region Property 11: XSS-safe encoding

    /// <summary>
    /// Property 11: XSS-safe encoding — HTML special characters in non-matched portions
    /// are HTML-encoded in the output.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property XssSafeEncoding_HtmlCharsEncodedInNonMatchedPortions()
    {
        return Prop.ForAll(
            AlphaWordGen(3, 6).ToArbitrary(),
            HtmlSpecialCharGen().ToArbitrary(),
            (string token, string htmlChars) =>
        {
            var service = CreateService(enableHighlights: true);
            // Text has HTML chars in a non-matched portion
            var text = htmlChars + " " + token;
            var result = service.Highlight(text, token);

            // The raw HTML chars should NOT appear unencoded in the output
            // (except inside the mark tags which wrap the token, not the HTML chars)
            var hasRawLessThan = htmlChars.Contains('<') &&
                result.Contains(htmlChars); // raw chars should not appear
            var hasRawGreaterThan = htmlChars.Contains('>') &&
                result.Contains(htmlChars);

            // Better check: the raw HTML special chars should be encoded
            if (htmlChars.Contains('<'))
            {
                // < should appear as &lt; in non-mark portions
                var resultWithoutMarks = result
                    .Replace("<mark>", "")
                    .Replace("</mark>", "");
                var containsRawLt = resultWithoutMarks.Contains('<');
                if (containsRawLt)
                    return false.Label(
                        $"Found raw '<' in non-mark output. Input: '{text}', Output: '{result}'");
            }

            if (htmlChars.Contains('>'))
            {
                var resultWithoutMarks = result
                    .Replace("<mark>", "")
                    .Replace("</mark>", "");
                var containsRawGt = resultWithoutMarks.Contains('>');
                if (containsRawGt)
                    return false.Label(
                        $"Found raw '>' in non-mark output. Input: '{text}', Output: '{result}'");
            }

            if (htmlChars.Contains('&') && !htmlChars.Contains("&lt;")
                && !htmlChars.Contains("&gt;") && !htmlChars.Contains("&amp;"))
            {
                // In the output, raw '&' should appear as '&amp;'
                // But we need to be careful: the encoded output will have &amp; etc.
                // So check that the portion before the mark does NOT contain a bare &
                // that isn't part of an HTML entity
                var markIdx = result.IndexOf("<mark>", StringComparison.Ordinal);
                if (markIdx > 0)
                {
                    var beforeMark = result[..markIdx];
                    // Every '&' in beforeMark should be the start of an entity
                    var ampIdx = 0;
                    while ((ampIdx = beforeMark.IndexOf('&', ampIdx)) >= 0)
                    {
                        var semiIdx = beforeMark.IndexOf(';', ampIdx);
                        if (semiIdx < 0 || semiIdx - ampIdx > 8)
                            return false.Label(
                                $"Found bare '&' in output before mark. Output: '{result}'");
                        ampIdx = semiIdx + 1;
                    }
                }
            }

            return true.Label("XSS encoding verified");
        });
    }

    /// <summary>
    /// Property 11 (continued): Output never contains raw &lt;script&gt; tags.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property XssSafeEncoding_NoRawScriptTagsInOutput()
    {
        return Prop.ForAll(
            AlphaWordGen(3, 6).ToArbitrary(),
            (string token) =>
        {
            var service = CreateService(enableHighlights: true);
            var text = "<script>alert('xss')</script> " + token + " <b>bold</b>";
            var result = service.Highlight(text, token);

            // The output should never contain raw <script> or <b> tags
            var resultWithoutMarks = result
                .Replace("<mark>", "")
                .Replace("</mark>", "");

            return (!resultWithoutMarks.Contains("<script>")
                && !resultWithoutMarks.Contains("<b>")
                && !resultWithoutMarks.Contains("</script>")
                && !resultWithoutMarks.Contains("</b>"))
                .Label($"Found raw HTML tags in output: '{result}'");
        });
    }

    #endregion

    #region Additional Property: EnableHighlights=false returns no mark elements

    /// <summary>
    /// When EnableHighlights is false, the output never contains &lt;mark&gt; elements.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property HighlightsDisabled_OutputNeverContainsMarkElements()
    {
        return Prop.ForAll(
            AlphaWordGen(2, 8).ToArbitrary(),
            (string token) =>
        {
            var service = CreateService(enableHighlights: false);
            var text = "prefix " + token + " suffix";
            var result = service.Highlight(text, token);

            return (!result.Contains("<mark>") && !result.Contains("</mark>"))
                .Label($"Expected no <mark> elements when disabled, got: '{result}'");
        });
    }

    /// <summary>
    /// When EnableHighlights is false, output is still HTML-encoded.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property HighlightsDisabled_OutputStillHtmlEncoded()
    {
        return Prop.ForAll(
            AlphaWordGen(3, 6).ToArbitrary(),
            (string token) =>
        {
            var service = CreateService(enableHighlights: false);
            var text = "<script>" + token + "</script>";
            var result = service.Highlight(text, token);

            // Should not contain raw HTML tags
            return (!result.Contains("<script>") && !result.Contains("</script>"))
                .Label($"Expected HTML encoding when disabled, got: '{result}'");
        });
    }

    #endregion

    #region Additional Property: Output preserves original case

    /// <summary>
    /// Output preserves original case of the text — matching is case-insensitive
    /// but the displayed text retains the original casing.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CasePreservation_OutputRetainsOriginalCase()
    {
        return Prop.ForAll(
            AlphaWordGen(3, 6).ToArbitrary(),
            (string token) =>
        {
            var service = CreateService(enableHighlights: true);
            // Create mixed-case token in text
            var mixedCase = char.ToUpper(token[0]) + token[1..];
            var text = "Hello " + mixedCase + " World";
            var result = service.Highlight(text, token.ToLowerInvariant());

            // The marked content should preserve the original mixed case
            var encodedMixedCase = System.Net.WebUtility.HtmlEncode(mixedCase);
            var expectedMark = $"<mark>{encodedMixedCase}</mark>";

            return result.Contains(expectedMark)
                .Label($"Expected original case '{mixedCase}' preserved in mark, got: '{result}'");
        });
    }

    #endregion
}
