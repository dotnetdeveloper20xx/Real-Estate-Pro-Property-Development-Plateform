using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.DeleteLandOwner;

/// <summary>
/// Handles soft-deletion of a LandOwner entity.
/// Sets IsDeleted=true, DeletedAt=UTC now, and DeletedBy=current user.
/// Throws EntityNotFoundException if the land owner does not exist.
/// </summary>
public sealed class DeleteLandOwnerCommandHandler : IRequestHandler<DeleteLandOwnerCommand, Unit>
{
    private readonly IRepository<LandOwner> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public DeleteLandOwnerCommandHandler(
        IRepository<LandOwner> repository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteLandOwnerCommand request, CancellationToken cancellationToken)
    {
        var landOwner = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (landOwner is null || landOwner.OpportunityId != request.OpportunityId)
        {
            throw new EntityNotFoundException(nameof(LandOwner), request.Id);
        }

        landOwner.IsDeleted = true;
        landOwner.DeletedAt = DateTime.UtcNow;
        landOwner.DeletedBy = _currentUserService.UserId ?? string.Empty;

        _repository.Update(landOwner);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
