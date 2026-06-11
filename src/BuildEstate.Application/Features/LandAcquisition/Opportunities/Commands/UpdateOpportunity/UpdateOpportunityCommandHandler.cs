using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.UpdateOpportunity;

/// <summary>
/// Handles updating an existing LandOpportunity entity.
/// Sets audit fields (UpdatedAt, UpdatedBy) and applies RowVersion for concurrency.
/// Throws EntityNotFoundException if the opportunity does not exist.
/// </summary>
public sealed class UpdateOpportunityCommandHandler : IRequestHandler<UpdateOpportunityCommand, OpportunityDto>
{
    private readonly IRepository<LandOpportunity> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateOpportunityCommandHandler(
        IRepository<LandOpportunity> repository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<OpportunityDto> Handle(UpdateOpportunityCommand request, CancellationToken cancellationToken)
    {
        var opportunity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.Id);
        }

        opportunity.Name = request.Name;
        opportunity.Location = request.Location;
        opportunity.LandSize = request.LandSize;
        opportunity.Source = request.Source;
        opportunity.ExpectedAcquisition = request.ExpectedAcquisition;
        opportunity.UpdatedAt = DateTime.UtcNow;
        opportunity.UpdatedBy = _currentUserService.UserId ?? string.Empty;
        opportunity.RowVersion = request.RowVersion;

        _repository.Update(opportunity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<OpportunityDto>(opportunity);
    }
}
