using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;

/// <summary>
/// Handles creation of a new LandOpportunity entity.
/// Checks for duplicate Name+Location, sets Status=Identified, audit fields, and persists.
/// </summary>
public sealed class CreateOpportunityCommandHandler : IRequestHandler<CreateOpportunityCommand, OpportunityDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateOpportunityCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<OpportunityDto> Handle(CreateOpportunityCommand request, CancellationToken cancellationToken)
    {
        // Check for duplicate Name + Location combination (excluding soft-deleted records)
        var duplicateExists = await _opportunityRepository.Query()
            .AnyAsync(o => o.Name == request.Name
                        && o.Location == request.Location
                        && !o.IsDeleted,
                cancellationToken);

        if (duplicateExists)
        {
            throw new DuplicateEntityException(nameof(LandOpportunity), "Name and Location");
        }

        var opportunity = new LandOpportunity
        {
            Name = request.Name,
            Location = request.Location,
            LandSize = request.LandSize,
            Status = OpportunityStatus.Identified,
            Source = request.Source,
            ExpectedAcquisition = request.ExpectedAcquisition,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _opportunityRepository.AddAsync(opportunity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<OpportunityDto>(opportunity);
    }
}
