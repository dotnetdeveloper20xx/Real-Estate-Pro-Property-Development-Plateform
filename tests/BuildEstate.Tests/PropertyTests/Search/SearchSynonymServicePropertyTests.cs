using FsCheck;
using FsCheck.Xunit;
using BuildEstate.Application.Features.Search.Services;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Options;

namespace BuildEstate.Tests.PropertyTests.Search;

/// <summary>
/// Property-based tests for SearchSynonymService synonym expansion correctness.
/// Tests with random queries containing terms from and outside the synonym dictionary
/// to verify expansion includes all synonyms for matching keys and no expansion for non-matching terms.
///
/// **Validates: Requirements 4.6**
/// </summary>
public class SearchSynonymServicePropertyTests
{
    #region Synonym Dictionary (mirrors service implementation)

    /// <summary>
    /// The synonym dictionary as defined in SearchSynonymService, used to verify expansion correctness.
    /// </summary>
    private static readonly Dictionary<string, string[]> SynonymDictionary = new(StringComparer.OrdinalIgnoreCase)
    {
        ["flat"] = ["apartment", "unit"],
        ["house"] = ["dwelling", "property", "home"],
        ["land"] = ["site", "plot", "parcel"],
        ["planning"] = ["permission", "consent", "approval"],
        ["legal"] = ["compliance", "regulatory", "statutory"],
        ["finance"] = ["budget", "cost", "financial"],
        ["construction"] = ["build", "development", "works"],
        ["owner"] = ["proprietor", "landlord"],
        ["tenant"] = ["lessee", "occupier", "renter"],
        ["contract"] = ["agreement", "deed"],
        ["purchase"] = ["acquisition", "buy"],
        ["sale"] = ["disposal", "sell"],
        ["risk"] = ["issue", "concern", "threat"],
        ["document"] = ["file", "attachment", "record"],
        ["project"] = ["scheme", "development"],
        ["inspection"] = ["survey", "assessment", "review"]
    };

    private static readonly string[] DictionaryKeys = SynonymDictionary.Keys.ToArray();

    #endregion

    #region Helpers

    private static SearchSynonymService CreateService(bool enabled = true)
    {
        var settings = Options.Create(new SearchSettings { EnableSynonyms = enabled });
        return new SearchSynonymService(settings);
    }

    /// <summary>
    /// Generator that produces a random key from the synonym dictionary.
    /// </summary>
    private static Gen<string> DictionaryKeyGen()
        => Gen.Elements(DictionaryKeys);

    /// <summary>
    /// Generator that produces a string guaranteed NOT to be a dictionary key.
    /// Uses alphabetic strings that are not in the dictionary.
    /// </summary>
    private static Gen<string> NonDictionaryTermGen()
    {
        return Gen.Elements(
            "xyz", "hello", "world", "table", "chair", "window",
            "garden", "river", "mountain", "cloud", "sunset",
            "laptop", "keyboard", "monitor", "mouse", "phone",
            "soccer", "tennis", "basketball", "cricket", "rugby",
            "coffee", "orange", "banana", "grape", "melon"
        );
    }

    #endregion

    /// <summary>
    /// Property 8.1: When synonyms are enabled and the query contains a dictionary key,
    /// the expanded list must contain ALL synonyms for that key.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property WhenEnabled_ExpansionContainsAllSynonyms()
    {
        return Prop.ForAll(DictionaryKeyGen().ToArbitrary(), (string key) =>
        {
            var service = CreateService(enabled: true);

            var expanded = service.ExpandQuery(key);
            var expectedSynonyms = SynonymDictionary[key];

            var allSynonymsPresent = expectedSynonyms.All(synonym => expanded.Contains(synonym));

            return allSynonymsPresent
                .Label($"Key '{key}' expanded to [{string.Join(", ", expanded)}] " +
                       $"but expected synonyms [{string.Join(", ", expectedSynonyms)}]");
        });
    }

    /// <summary>
    /// Property 8.2: When synonyms are enabled, the expanded list always includes the original tokens.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property WhenEnabled_ExpansionAlwaysContainsOriginalTokens()
    {
        var queryGen = Gen.OneOf(
            DictionaryKeyGen(),
            NonDictionaryTermGen(),
            Gen.Constant("flat land"),
            Gen.Constant("house planning"),
            Gen.Constant("hello world")
        );

        return Prop.ForAll(queryGen.ToArbitrary(), (string query) =>
        {
            var service = CreateService(enabled: true);

            var expanded = service.ExpandQuery(query);
            var tokens = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            var allOriginalPresent = tokens.All(token => expanded.Contains(token));

            return allOriginalPresent
                .Label($"Query '{query}' expanded to [{string.Join(", ", expanded)}] " +
                       $"but original tokens [{string.Join(", ", tokens)}] not all present");
        });
    }

    /// <summary>
    /// Property 8.3: When synonyms are enabled and a token is NOT in the dictionary,
    /// only the original token appears (no extra expansion for that token).
    /// </summary>
    [Property(MaxTest = 200)]
    public Property WhenEnabled_NonDictionaryTerms_NoExtraExpansion()
    {
        return Prop.ForAll(NonDictionaryTermGen().ToArbitrary(), (string term) =>
        {
            var service = CreateService(enabled: true);

            var expanded = service.ExpandQuery(term);

            // For a single non-dictionary term, the expanded list should contain exactly [term]
            var onlyOriginal = expanded.Count == 1 && expanded[0] == term;

            return onlyOriginal
                .Label($"Non-dictionary term '{term}' expanded to [{string.Join(", ", expanded)}] " +
                       $"but expected only ['{term}']");
        });
    }

    /// <summary>
    /// Property 8.4: When synonyms are disabled (EnableSynonyms=false),
    /// ExpandQuery returns [query] as a single-item list regardless of content.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property WhenDisabled_ReturnsOriginalQueryAsSingleItem()
    {
        var queryGen = Gen.OneOf(
            DictionaryKeyGen(),
            NonDictionaryTermGen(),
            Gen.Constant("flat land house"),
            Gen.Constant("hello world"),
            Gen.Constant("construction finance")
        );

        return Prop.ForAll(queryGen.ToArbitrary(), (string query) =>
        {
            var service = CreateService(enabled: false);

            var expanded = service.ExpandQuery(query);

            var isSingleItem = expanded.Count == 1 && expanded[0] == query;

            return isSingleItem
                .Label($"Disabled service with query '{query}' returned [{string.Join(", ", expanded)}] " +
                       $"but expected single item ['{query}']");
        });
    }

    /// <summary>
    /// Property 8.5: When synonyms are enabled and input is empty or whitespace,
    /// the result is returned as-is (single item containing the original input).
    /// </summary>
    [Property(MaxTest = 100)]
    public Property WhenEnabled_EmptyOrWhitespace_ReturnsAsIs()
    {
        var emptyGen = Gen.Elements("", " ", "   ", "\t", "\n", "  \t  ");

        return Prop.ForAll(emptyGen.ToArbitrary(), (string input) =>
        {
            var service = CreateService(enabled: true);

            var expanded = service.ExpandQuery(input);

            var returnsAsIs = expanded.Count == 1 && expanded[0] == input;

            return returnsAsIs
                .Label($"Empty/whitespace input '{input.Replace("\t", "\\t").Replace("\n", "\\n")}' " +
                       $"expanded to {expanded.Count} items but expected single item as-is");
        });
    }
}
