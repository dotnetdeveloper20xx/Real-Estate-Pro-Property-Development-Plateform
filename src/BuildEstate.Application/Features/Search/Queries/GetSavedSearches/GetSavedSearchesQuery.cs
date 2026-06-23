using BuildEstate.Application.Features.Search.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.Search.Queries.GetSavedSearches;

/// <summary>
/// Query to retrieve the current user's saved searches ordered by SavedAt descending.
/// </summary>
public sealed record GetSavedSearchesQuery : IRequest<List<SavedSearchDto>>;
