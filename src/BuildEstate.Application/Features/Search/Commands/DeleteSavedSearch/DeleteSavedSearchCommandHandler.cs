using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.DeleteSavedSearch;

/// <summary>
/// Handles DeleteSavedSearchCommand by soft-deleting the SavedSearch with the specified ID.
/// Verifies the saved search belongs to the current user before deletion.
/// </summary>
public sealed class DeleteSavedSearchCommandHandler : IRequestHandler<DeleteSavedSearchCommand, Unit>
{
    private readonly IRepository<SavedSearch> _savedSearchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public DeleteSavedSearchCommandHandler(
        IRepository<SavedSearch> savedSearchRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _savedSearchRepository = savedSearchRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteSavedSearchCommand request, CancellationToken cancellationToken)
    {
        var savedSearch = await _savedSearchRepository.GetByIdAsync(request.Id, cancellationToken);

        if (savedSearch is null)
        {
            throw new EntityNotFoundException(nameof(SavedSearch), request.Id);
        }

        var userId = _currentUserService.UserId ?? string.Empty;
        if (savedSearch.UserId != userId)
        {
            throw new EntityNotFoundException(nameof(SavedSearch), request.Id);
        }

        // Soft-delete
        savedSearch.IsDeleted = true;
        savedSearch.DeletedAt = DateTime.UtcNow;
        savedSearch.DeletedBy = userId;

        _savedSearchRepository.Update(savedSearch);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
