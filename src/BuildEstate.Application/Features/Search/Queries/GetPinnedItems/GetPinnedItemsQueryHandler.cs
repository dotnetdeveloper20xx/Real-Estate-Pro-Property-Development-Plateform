using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.Search.Queries.GetPinnedItems;

/// <summary>
/// Handles GetPinnedItemsQuery by returning the user's pinned items ordered by PinnedAt descending.
/// </summary>
public sealed class GetPinnedItemsQueryHandler : IRequestHandler<GetPinnedItemsQuery, List<PinnedItemDto>>
{
    private readonly IRepository<PinnedItem> _pinnedItemRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetPinnedItemsQueryHandler(
        IRepository<PinnedItem> pinnedItemRepository,
        ICurrentUserService currentUserService)
    {
        _pinnedItemRepository = pinnedItemRepository;
        _currentUserService = currentUserService;
    }

    public async Task<List<PinnedItemDto>> Handle(GetPinnedItemsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? string.Empty;

        var pinnedItems = await _pinnedItemRepository.Query()
            .AsNoTracking()
            .Where(pi => pi.UserId == userId)
            .OrderByDescending(pi => pi.PinnedAt)
            .Select(pi => new PinnedItemDto
            {
                Id = pi.Id,
                EntityId = pi.EntityId,
                EntityType = pi.EntityType,
                Title = pi.Title,
                Subtitle = pi.Subtitle,
                Icon = pi.Icon,
                Category = pi.Category,
                NavigationRoute = pi.NavigationRoute,
                PinnedAt = pi.PinnedAt
            })
            .ToListAsync(cancellationToken);

        return pinnedItems;
    }
}
