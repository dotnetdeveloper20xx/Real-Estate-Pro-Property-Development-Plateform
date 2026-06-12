using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.CreateCondition;

/// <summary>
/// Handles creation of a new PlanningCondition entity.
/// Validates that the parent application is ApprovedWithConditions and ConditionNumber is unique within the application.
/// </summary>
public sealed class CreateConditionCommandHandler : IRequestHandler<CreateConditionCommand, ConditionDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<PlanningCondition> _conditionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateConditionCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<PlanningCondition> conditionRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _applicationRepository = applicationRepository;
        _conditionRepository = conditionRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<ConditionDto> Handle(CreateConditionCommand request, CancellationToken cancellationToken)
    {
        // Load and verify the parent application exists
        var application = await _applicationRepository.GetByIdAsync(request.ApplicationId, cancellationToken);

        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        // Verify the application has Status = ApprovedWithConditions
        if (application.Status != PlanningApplicationStatus.ApprovedWithConditions)
        {
            throw new BusinessRuleViolationException(
                "ConditionRequiresApprovedWithConditions",
                $"Conditions can only be added to applications with status '{PlanningApplicationStatus.ApprovedWithConditions}'. Current status is '{application.Status}'.");
        }

        // Verify ConditionNumber is unique within the application
        var duplicateExists = await _conditionRepository.Query()
            .AnyAsync(c => c.ApplicationId == request.ApplicationId
                        && c.ConditionNumber == request.ConditionNumber
                        && !c.IsDeleted,
                cancellationToken);

        if (duplicateExists)
        {
            throw new DuplicateEntityException(
                nameof(PlanningCondition),
                $"ConditionNumber {request.ConditionNumber} for ApplicationId {request.ApplicationId}");
        }

        var condition = new PlanningCondition
        {
            ApplicationId = request.ApplicationId,
            ConditionNumber = request.ConditionNumber,
            Description = request.Description,
            ConditionType = request.ConditionType,
            Status = ConditionStatus.Outstanding,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _conditionRepository.AddAsync(condition, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ConditionDto>(condition);
    }
}
