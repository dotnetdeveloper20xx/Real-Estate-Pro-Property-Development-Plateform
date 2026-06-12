using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.CreateAppeal;

/// <summary>
/// Handles creation of a new PlanningAppeal entity.
/// Validates the parent application is refused and no active appeal already exists.
/// </summary>
public sealed class CreateAppealCommandHandler : IRequestHandler<CreateAppealCommand, AppealDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<PlanningAppeal> _appealRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateAppealCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<PlanningAppeal> appealRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _applicationRepository = applicationRepository;
        _appealRepository = appealRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<AppealDto> Handle(CreateAppealCommand request, CancellationToken cancellationToken)
    {
        // 1. Load parent application and verify it exists
        var application = await _applicationRepository.GetByIdAsync(request.ApplicationId, cancellationToken);

        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        // 2. Verify parent application has Status = Refused
        if (application.Status != PlanningApplicationStatus.Refused)
        {
            throw new BusinessRuleViolationException(
                "AppealRequiresRefusedApplication",
                "Only refused applications can be appealed. Current status: " + application.Status);
        }

        // 3. Verify no active appeal exists for same application
        //    Active = Status NOT IN (Dismissed, Closed)
        var activeAppealExists = await _appealRepository.Query()
            .AnyAsync(a => a.ApplicationId == request.ApplicationId
                        && a.Status != AppealStatus.Dismissed
                        && a.Status != AppealStatus.Closed
                        && !a.IsDeleted,
                cancellationToken);

        if (activeAppealExists)
        {
            throw new DuplicateEntityException(nameof(PlanningAppeal), "ApplicationId (active appeal already exists)");
        }

        // 4. Create appeal entity
        var appeal = new PlanningAppeal
        {
            ApplicationId = request.ApplicationId,
            AppealGrounds = request.AppealGrounds,
            AppealType = request.AppealType,
            Status = AppealStatus.Lodged,
            LodgedDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        // 5. Save and return mapped DTO
        await _appealRepository.AddAsync(appeal, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<AppealDto>(appeal);
    }
}
