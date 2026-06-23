using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.Search.Queries.GetSuggestions;

/// <summary>
/// Handles GetSuggestionsQuery by querying recent searches matching the prefix.
/// Returns distinct query strings ordered by most recent, limited to the requested count.
/// </summary>
public sealed class GetSuggestionsQueryHandler : IRequestHandler<GetSuggestionsQuery, List<string>>
{
    private readonly IRepository<RecentSearch> _recentSearchRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetSuggestionsQueryHandler(
        IRepository<RecentSearch> recentSearchRepository,
        ICurrentUserService currentUserService)
    {
        _recentSearchRepository = recentSearchRepository;
        _currentUserService = currentUserService;
    }

    public async Task<List<string>> Handle(GetSuggestionsQuery request, CancellationToken cancellationToken)
    {
        var prefix = request.Prefix.Trim().ToLowerInvariant();
        var limit = Math.Clamp(request.Limit, 1, 20);

        if (prefix.Length < 2)
        {
            return new List<string>();
        }

        if (prefix.Length > 100)
        {
            prefix = prefix[..100];
        }

        var userId = _currentUserService.UserId ?? string.Empty;

        var suggestions = await _recentSearchRepository.Query()
            .AsNoTracking()
            .Where(rs => rs.UserId == userId && rs.Query.ToLower().StartsWith(prefix))
            .OrderByDescending(rs => rs.SearchedAt)
            .Select(rs => rs.Query)
            .Distinct()
            .Take(limit)
            .ToListAsync(cancellationToken);

        return suggestions;
    }
}
