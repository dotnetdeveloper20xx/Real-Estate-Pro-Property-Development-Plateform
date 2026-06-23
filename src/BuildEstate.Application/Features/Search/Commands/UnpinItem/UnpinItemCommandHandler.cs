using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.UnpinItem;

/// <summary>
/// Handles UnpinItemCommand by soft-deleting the PinnedItem with the specified ID.
/// Verifies the item belongs to the current user before deletion.
/// </summary>
public sealed class UnpinItemCommandHandler : IRequestHandler<UnpinItemCommand, Unit>
{
    private readonly IRepository<PinnedItem> _pinnedItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UnpinItemCommandHandler(
        IRepository<PinnedItem> pinnedItemRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _pinnedItemRepository = pinnedItemRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(UnpinItemCommand request, CancellationToken cancellationToken)
    {
        var pinnedItem = await _pinnedItemRepository.GetByIdAsync(request.Id, cancellationToken);

        if (pinnedItem is null)
        {
            throw new EntityNotFoundException(nameof(PinnedItem), request.Id);
        }

        var userId = _currentUserService.UserId ?? string.Empty;
        if (pinnedItem.UserId != userId)
        {
            throw new EntityNotFoundException(nameof(PinnedItem), request.Id);
        }

        // Soft-delete
        pinnedItem.IsDeleted = true;
        pinnedItem.DeletedAt = DateTime.UtcNow;
        pinnedItem.DeletedBy = userId;

        _pinnedItemRepository.Update(pinnedItem);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
