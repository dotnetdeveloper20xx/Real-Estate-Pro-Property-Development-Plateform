using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CreateMilestone;

/// <summary>
/// Handles creation of a new PlanningMilestone entity.
/// Validates the parent application exists, enforces MilestoneType uniqueness
/// within the application, and sets Status = Pending.
/// </summary>
public sealed class CreateMilestoneCommandHandler : IRequestHandler<CreateMilestoneCommand, MilestoneDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<PlanningMilestone> _milestoneRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateMilestoneCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<PlanningMilestone> milestoneRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _applicationRepository = applicationRepository;
        _milestoneRepository = milestoneRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<MilestoneDto> Handle(CreateMilestoneCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify the PlanningApplication exists
        var application = await _applicationRepository.Query()
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId && !a.IsDeleted, cancellationToken);

        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        // 2. Enforce MilestoneType uniqueness within the application
        var duplicateExists = await _milestoneRepository.Query()
            .AnyAsync(m => m.ApplicationId == request.ApplicationId
                        && m.MilestoneType == request.MilestoneType
                        && !m.IsDeleted,
                cancellationToken);

        if (duplicateExists)
        {
            throw new DuplicateEntityException(
                nameof(PlanningMilestone),
                "MilestoneType (a milestone of this type already exists for the application)");
        }

        // 3. Create the PlanningMilestone entity with Status = Pending
        var milestone = new PlanningMilestone
        {
            Id = Guid.NewGuid(),
            ApplicationId = request.ApplicationId,
            MilestoneType = request.MilestoneType,
            Status = MilestoneStatus.Pending,
            TargetDate = request.TargetDate,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _milestoneRepository.AddAsync(milestone, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4. Return the mapped DTO
        return _mapper.Map<MilestoneDto>(milestone);
    }
}
