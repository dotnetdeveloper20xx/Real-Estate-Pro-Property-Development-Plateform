using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.Search.Queries.GetRecentSearches;

/// <summary>
/// Handles GetRecentSearchesQuery by returning the user's recent searches
/// ordered by SearchedAt descending, limited to 20 entries.
/// </summary>
public sealed class GetRecentSearchesQueryHandler : IRequestHandler<GetRecentSearchesQuery, List<RecentSearchDto>>
{
    private const int MaxRecentSearches = 20;

    private readonly IRepository<RecentSearch> _recentSearchRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetRecentSearchesQueryHandler(
        IRepository<RecentSearch> recentSearchRepository,
        ICurrentUserService currentUserService)
    {
        _recentSearchRepository = recentSearchRepository;
        _currentUserService = currentUserService;
    }

    public async Task<List<RecentSearchDto>> Handle(GetRecentSearchesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? string.Empty;

        var recentSearches = await _recentSearchRepository.Query()
            .AsNoTracking()
            .Where(rs => rs.UserId == userId)
            .OrderByDescending(rs => rs.SearchedAt)
            .Take(MaxRecentSearches)
            .Select(rs => new RecentSearchDto
            {
                Id = rs.Id,
                Query = rs.Query,
                ResultCount = rs.ResultCount,
                SearchedAt = rs.SearchedAt
            })
            .ToListAsync(cancellationToken);

        return recentSearches;
    }
}
