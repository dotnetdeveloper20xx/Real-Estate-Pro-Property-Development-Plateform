using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Settings;
using Microsoft.Extensions.Options;

namespace BuildEstate.Application.Features.Search.Services;

/// <summary>
/// Expands search queries with predefined synonym terms from a case-insensitive dictionary.
/// When enabled, each token in the query is looked up in the synonym dictionary and all
/// associated synonyms are appended to the expanded term list.
/// When disabled, the original query is returned as a single-item list.
/// </summary>
public sealed class SearchSynonymService : ISearchSynonymService
{
    private readonly SearchSettings _settings;

    /// <summary>
    /// Case-insensitive synonym dictionary mapping a canonical term to its synonyms.
    /// This dictionary is used to expand queries for improved search recall.
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

    public SearchSynonymService(IOptions<SearchSettings> settings)
    {
        _settings = settings.Value;
    }

    /// <inheritdoc />
    public bool IsEnabled => _settings.EnableSynonyms;

    /// <inheritdoc />
    public IReadOnlyList<string> ExpandQuery(string query)
    {
        if (!IsEnabled)
            return [query];

        if (string.IsNullOrWhiteSpace(query))
            return [query];

        var tokens = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var expandedTerms = new List<string>(tokens.Length * 3);

        foreach (var token in tokens)
        {
            // Always include the original token
            expandedTerms.Add(token);

            // Add synonyms if the token matches a dictionary key
            if (SynonymDictionary.TryGetValue(token, out var synonyms))
            {
                expandedTerms.AddRange(synonyms);
            }
        }

        return expandedTerms;
    }
}
