using BuildEstate.Application.Features.Search.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.Search.Queries.GetSuggestions;

/// <summary>
/// Query to retrieve autocomplete suggestions based on a prefix string.
/// Prefix must be at least 2 characters; max query length 100 characters; limit 1–20 (default 8).
/// </summary>
public sealed record GetSuggestionsQuery : IRequest<List<string>>
{
    public string Prefix { get; init; } = string.Empty;
    public int Limit { get; init; } = 8;
}
