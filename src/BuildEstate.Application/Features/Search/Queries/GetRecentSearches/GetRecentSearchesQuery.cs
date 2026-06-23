using BuildEstate.Application.Features.Search.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.Search.Queries.GetRecentSearches;

/// <summary>
/// Query to retrieve the current user's recent searches, ordered by most recent first, max 20 items.
/// </summary>
public sealed record GetRecentSearchesQuery : IRequest<List<RecentSearchDto>>;
