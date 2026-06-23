using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.AddRecentSearch;

/// <summary>
/// Handles AddRecentSearchCommand by creating a RecentSearch entity with the current user's ID.
/// </summary>
public sealed class AddRecentSearchCommandHandler : IRequestHandler<AddRecentSearchCommand, Unit>
{
    private readonly IRepository<RecentSearch> _recentSearchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public AddRecentSearchCommandHandler(
        IRepository<RecentSearch> recentSearchRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _recentSearchRepository = recentSearchRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(AddRecentSearchCommand request, CancellationToken cancellationToken)
    {
        var recentSearch = new RecentSearch
        {
            UserId = _currentUserService.UserId ?? string.Empty,
            Query = request.Query,
            ResultCount = request.ResultCount,
            SearchedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _recentSearchRepository.AddAsync(recentSearch, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
