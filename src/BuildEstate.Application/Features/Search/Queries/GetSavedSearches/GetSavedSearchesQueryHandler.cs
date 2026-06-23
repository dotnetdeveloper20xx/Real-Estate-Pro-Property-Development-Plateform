using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.Search.Queries.GetSavedSearches;

/// <summary>
/// Handles GetSavedSearchesQuery by returning the user's saved searches ordered by SavedAt descending.
/// </summary>
public sealed class GetSavedSearchesQueryHandler : IRequestHandler<GetSavedSearchesQuery, List<SavedSearchDto>>
{
    private readonly IRepository<SavedSearch> _savedSearchRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetSavedSearchesQueryHandler(
        IRepository<SavedSearch> savedSearchRepository,
        ICurrentUserService currentUserService)
    {
        _savedSearchRepository = savedSearchRepository;
        _currentUserService = currentUserService;
    }

    public async Task<List<SavedSearchDto>> Handle(GetSavedSearchesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? string.Empty;

        var savedSearches = await _savedSearchRepository.Query()
            .AsNoTracking()
            .Where(ss => ss.UserId == userId)
            .OrderByDescending(ss => ss.SavedAt)
            .Select(ss => new SavedSearchDto
            {
                Id = ss.Id,
                Name = ss.Name,
                Query = ss.Query,
                FiltersJson = ss.FiltersJson,
                SavedAt = ss.SavedAt,
                LastUsedAt = ss.LastUsedAt
            })
            .ToListAsync(cancellationToken);

        return savedSearches;
    }
}
