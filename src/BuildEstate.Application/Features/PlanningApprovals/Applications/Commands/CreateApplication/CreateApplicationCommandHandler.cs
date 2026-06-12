using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.CreateApplication;

/// <summary>
/// Handles creation of a new PlanningApplication entity.
/// Validates the referenced LandOpportunity is Acquired,
/// checks no active application exists for the same opportunity,
/// sets Status = PreApplication, and persists the entity.
/// </summary>
public sealed class CreateApplicationCommandHandler : IRequestHandler<CreateApplicationCommand, ApplicationDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateApplicationCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<PlanningApplication> applicationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _applicationRepository = applicationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<ApplicationDto> Handle(CreateApplicationCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify the LandOpportunity exists and has Status = Acquired
        var opportunity = await _opportunityRepository.Query()
            .FirstOrDefaultAsync(o => o.Id == request.OpportunityId && !o.IsDeleted, cancellationToken);

        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        if (opportunity.Status != OpportunityStatus.Acquired)
        {
            throw new BusinessRuleViolationException(
                "OpportunityMustBeAcquired",
                "Planning applications can only be created for land opportunities with Acquired status.");
        }

        // 2. Check no active application exists for this opportunity
        //    Active = Status NOT IN (Withdrawn, Refused)
        var activeApplicationExists = await _applicationRepository.Query()
            .AnyAsync(a => a.OpportunityId == request.OpportunityId
                        && a.Status != PlanningApplicationStatus.Withdrawn
                        && a.Status != PlanningApplicationStatus.Refused
                        && !a.IsDeleted,
                cancellationToken);

        if (activeApplicationExists)
        {
            throw new DuplicateEntityException(
                nameof(PlanningApplication),
                "OpportunityId (an active application already exists for this opportunity)");
        }

        // 3. Create the PlanningApplication entity
        var application = new PlanningApplication
        {
            Id = Guid.NewGuid(),
            OpportunityId = request.OpportunityId,
            Description = request.Description,
            ApplicationType = request.ApplicationType,
            CouncilName = request.CouncilName,
            Status = PlanningApplicationStatus.PreApplication,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _applicationRepository.AddAsync(application, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4. Return the mapped DTO
        return _mapper.Map<ApplicationDto>(application);
    }
}
