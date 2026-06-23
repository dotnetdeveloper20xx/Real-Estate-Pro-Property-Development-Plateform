using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.PinItem;

/// <summary>
/// Handles PinItemCommand by creating a PinnedItem entity with the current user's ID.
/// </summary>
public sealed class PinItemCommandHandler : IRequestHandler<PinItemCommand, PinnedItemDto>
{
    private readonly IRepository<PinnedItem> _pinnedItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public PinItemCommandHandler(
        IRepository<PinnedItem> pinnedItemRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _pinnedItemRepository = pinnedItemRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<PinnedItemDto> Handle(PinItemCommand request, CancellationToken cancellationToken)
    {
        var pinnedItem = new PinnedItem
        {
            UserId = _currentUserService.UserId ?? string.Empty,
            EntityId = request.EntityId,
            EntityType = request.EntityType,
            Title = request.Title,
            Subtitle = request.Subtitle,
            Icon = request.Icon,
            Category = request.Category,
            NavigationRoute = request.NavigationRoute,
            PinnedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _pinnedItemRepository.AddAsync(pinnedItem, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PinnedItemDto
        {
            Id = pinnedItem.Id,
            EntityId = pinnedItem.EntityId,
            EntityType = pinnedItem.EntityType,
            Title = pinnedItem.Title,
            Subtitle = pinnedItem.Subtitle,
            Icon = pinnedItem.Icon,
            Category = pinnedItem.Category,
            NavigationRoute = pinnedItem.NavigationRoute,
            PinnedAt = pinnedItem.PinnedAt
        };
    }
}
