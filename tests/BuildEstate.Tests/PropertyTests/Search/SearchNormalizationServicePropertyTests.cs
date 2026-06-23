using System.Globalization;
using System.Text;
using FsCheck;
using FsCheck.Xunit;
using BuildEstate.Application.Features.Search.Services;

namespace BuildEstate.Tests.PropertyTests.Search;

/// <summary>
/// Property-based tests for SearchNormalizationService invariants.
/// Tests with arbitrary Unicode strings, strings with diacritics, excessive whitespace,
/// and strings exceeding 200 characters to verify normalization guarantees.
///
/// **Validates: Requirements 2.6, 4.8, 18.1, 18.5**
/// </summary>
public class SearchNormalizationServicePropertyTests
{
    #region Custom Generators

    /// <summary>
    /// Generates arbitrary Unicode strings including diacritics, whitespace variations,
    /// and long strings to stress the normalization service.
    /// </summary>
    private static Arbitrary<string> UnicodeStringArbitrary()
    {
        var unicodeGen = Gen.OneOf(
            // Regular ASCII strings
            Arb.Default.NonNull<string>().Generator.Select(s => s.Get),
            // Strings with diacritics
            Gen.Elements(
                "café résumé naïve", "Ñoño señor", "Ångström über",
                "crème brûlée", "São Paulo", "Zürich Düsseldorf",
                "Ñoño señor piñata jalapeño", "Dvořák Škoda Plzeň",
                "Łódź Gdańsk Wrocław", "Ísland Þór Æsir"),
            // Strings with excessive whitespace
            Gen.Elements(
                "   lots   of    spaces   ", "\t\ttabs\t\there\t",
                "  \r\n  newlines  \r\n  mixed  ",
                "    leading", "trailing    ",
                "mixed   \t  whitespace   \n  types"),
            // Long strings exceeding 200 characters
            Gen.ArrayOf(250, Gen.Elements("abcdefghijklmnopqrstuvwxyz éèêë àâ üöä ñ".ToCharArray()))
                .Select(chars => new string(chars)),
            // Very long strings (500+ chars)
            Gen.ArrayOf(500, Gen.Elements("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ".ToCharArray()))
                .Select(chars => new string(chars)),
            // Empty and whitespace-only
            Gen.Elements("", " ", "   ", "\t", "\n", "\r\n")
        );

        return unicodeGen.ToArbitrary();
    }

    #endregion

    /// <summary>
    /// Property 1: Normalized output is always lowercase.
    /// For any non-null input string, the normalized result must equal its own ToLowerInvariant().
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Normalize_AlwaysReturnsLowercase()
    {
        return Prop.ForAll(UnicodeStringArbitrary(), (string input) =>
        {
            var result = SearchNormalizationService.Normalize(input);
            return (result == result.ToLowerInvariant())
                .Label($"Result '{result}' should be lowercase");
        });
    }

    /// <summary>
    /// Property 1: Normalized output is always trimmed (no leading/trailing whitespace).
    /// For any non-null input string, the normalized result must equal its own Trim().
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Normalize_AlwaysTrimmed()
    {
        return Prop.ForAll(UnicodeStringArbitrary(), (string input) =>
        {
            var result = SearchNormalizationService.Normalize(input);
            return (result == result.Trim())
                .Label($"Result '{result}' should be trimmed");
        });
    }

    /// <summary>
    /// Property 1: Normalized output never contains consecutive spaces.
    /// For any non-null input string, the normalized result must not contain "  " (two spaces).
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Normalize_NoConsecutiveSpaces()
    {
        return Prop.ForAll(UnicodeStringArbitrary(), (string input) =>
        {
            var result = SearchNormalizationService.Normalize(input);
            return (!result.Contains("  "))
                .Label($"Result '{result}' should not contain consecutive spaces");
        });
    }

    /// <summary>
    /// Property 1: Normalized output contains no diacritical marks.
    /// For any non-null input string, the normalized result when decomposed (FormD)
    /// must not contain any NonSpacingMark characters.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Normalize_NoDiacriticalMarks()
    {
        return Prop.ForAll(UnicodeStringArbitrary(), (string input) =>
        {
            var result = SearchNormalizationService.Normalize(input);

            if (string.IsNullOrEmpty(result))
                return true.Label("Empty result has no diacritics");

            var decomposed = result.Normalize(NormalizationForm.FormD);
            var hasDiacritics = decomposed.Any(c =>
                CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark);

            return (!hasDiacritics)
                .Label($"Result '{result}' should not contain diacritical marks");
        });
    }

    /// <summary>
    /// Property 1: Normalized output never exceeds 200 characters.
    /// For any non-null input string (including those exceeding 200 chars),
    /// the normalized result length must be at most 200.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Normalize_MaxLength200()
    {
        return Prop.ForAll(UnicodeStringArbitrary(), (string input) =>
        {
            var result = SearchNormalizationService.Normalize(input);
            return (result.Length <= 200)
                .Label($"Result length {result.Length} should be <= 200");
        });
    }

    /// <summary>
    /// Property 1: Null or whitespace-only input always produces empty string.
    /// For any whitespace-only string, the normalized result must be empty.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Normalize_WhitespaceOnlyInput_ReturnsEmpty()
    {
        var whitespaceGen = Gen.OneOf(
            Gen.Constant((string)null!),
            Gen.Constant(""),
            Gen.Constant(" "),
            Gen.Constant("   "),
            Gen.Constant("\t"),
            Gen.Constant("\n"),
            Gen.Constant("\r\n"),
            Gen.Constant("  \t  \n  ")
        );

        return Prop.ForAll(whitespaceGen.ToArbitrary(), (string input) =>
        {
            var result = SearchNormalizationService.Normalize(input);
            return (result == string.Empty)
                .Label($"Input '{input ?? "null"}' should normalize to empty string");
        });
    }

    /// <summary>
    /// Property 1: Normalized output never contains tab, newline, or other whitespace characters.
    /// All whitespace is collapsed to regular spaces only.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Normalize_NoSpecialWhitespace()
    {
        return Prop.ForAll(UnicodeStringArbitrary(), (string input) =>
        {
            var result = SearchNormalizationService.Normalize(input);

            if (string.IsNullOrEmpty(result))
                return true.Label("Empty result has no whitespace issues");

            var hasSpecialWhitespace = result.Any(c => char.IsWhiteSpace(c) && c != ' ');
            return (!hasSpecialWhitespace)
                .Label($"Result '{result}' should not contain tabs, newlines, or special whitespace");
        });
    }
}
