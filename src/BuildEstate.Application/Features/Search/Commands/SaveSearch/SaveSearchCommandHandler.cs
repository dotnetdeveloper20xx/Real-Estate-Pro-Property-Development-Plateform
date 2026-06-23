using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.SaveSearch;

/// <summary>
/// Handles SaveSearchCommand by creating a SavedSearch entity for the current user.
/// </summary>
public sealed class SaveSearchCommandHandler : IRequestHandler<SaveSearchCommand, SavedSearchDto>
{
    private readonly IRepository<SavedSearch> _savedSearchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public SaveSearchCommandHandler(
        IRepository<SavedSearch> savedSearchRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _savedSearchRepository = savedSearchRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<SavedSearchDto> Handle(SaveSearchCommand request, CancellationToken cancellationToken)
    {
        var savedSearch = new SavedSearch
        {
            UserId = _currentUserService.UserId ?? string.Empty,
            Name = request.Name,
            Query = request.Query,
            FiltersJson = request.FiltersJson,
            SavedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _savedSearchRepository.AddAsync(savedSearch, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SavedSearchDto
        {
            Id = savedSearch.Id,
            Name = savedSearch.Name,
            Query = savedSearch.Query,
            FiltersJson = savedSearch.FiltersJson,
            SavedAt = savedSearch.SavedAt,
            LastUsedAt = savedSearch.LastUsedAt
        };
    }
}
