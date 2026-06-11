using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.DeleteOpportunity;

/// <summary>
/// Handles soft-deletion of a LandOpportunity entity.
/// Sets IsDeleted=true, DeletedAt=UTC now, and DeletedBy=current user.
/// Throws EntityNotFoundException if the opportunity does not exist.
/// </summary>
public sealed class DeleteOpportunityCommandHandler : IRequestHandler<DeleteOpportunityCommand, Unit>
{
    private readonly IRepository<LandOpportunity> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public DeleteOpportunityCommandHandler(
        IRepository<LandOpportunity> repository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteOpportunityCommand request, CancellationToken cancellationToken)
    {
        var opportunity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.Id);
        }

        opportunity.IsDeleted = true;
        opportunity.DeletedAt = DateTime.UtcNow;
        opportunity.DeletedBy = _currentUserService.UserId ?? string.Empty;

        _repository.Update(opportunity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
