using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.TransitionConditionStatus;

/// <summary>
/// Handles transitioning a planning condition to a new status.
/// Validates via the condition state machine, enforces discharge data requirements,
/// and raises AllConditionsDischargedDomainEvent when all conditions for the application are discharged.
/// </summary>
public sealed class TransitionConditionStatusCommandHandler
    : IRequestHandler<TransitionConditionStatusCommand, ConditionDto>
{
    private readonly IRepository<PlanningCondition> _conditionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IConditionStatusStateMachine _stateMachine;

    public TransitionConditionStatusCommandHandler(
        IRepository<PlanningCondition> conditionRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IConditionStatusStateMachine stateMachine)
    {
        _conditionRepository = conditionRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
    }

    public async Task<ConditionDto> Handle(
        TransitionConditionStatusCommand request,
        CancellationToken cancellationToken)
    {
        // Load the condition by ID
        var condition = await _conditionRepository.GetByIdAsync(request.ConditionId, cancellationToken);

        if (condition is null)
        {
            throw new EntityNotFoundException(nameof(PlanningCondition), request.ConditionId);
        }

        // Validate the transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(condition.Status, request.NewStatus);

        // Apply discharge-specific data when transitioning to Discharged
        if (request.NewStatus == ConditionStatus.Discharged)
        {
            condition.DischargeDate = request.DischargeDate;
            condition.DischargeReference = request.DischargeReference;
        }

        // Apply the status transition
        condition.Status = request.NewStatus;
        condition.UpdatedAt = DateTime.UtcNow;
        condition.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _conditionRepository.Update(condition);

        // Check if all conditions for the same application are now Discharged
        if (request.NewStatus == ConditionStatus.Discharged)
        {
            await CheckAllConditionsDischargedAsync(condition, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ConditionDto>(condition);
    }

    /// <summary>
    /// Checks whether all conditions for the given application have reached Discharged status.
    /// If so, raises the AllConditionsDischargedDomainEvent on the current condition entity.
    /// </summary>
    private async Task CheckAllConditionsDischargedAsync(
        PlanningCondition currentCondition,
        CancellationToken cancellationToken)
    {
        var allConditions = await _conditionRepository.Query()
            .Where(c => c.ApplicationId == currentCondition.ApplicationId && !c.IsDeleted)
            .ToListAsync(cancellationToken);

        var allDischarged = allConditions.All(c => c.Status == ConditionStatus.Discharged);

        if (allDischarged && allConditions.Count > 0)
        {
            currentCondition.RaiseAllConditionsDischargedEvent(allConditions.Count);
        }
    }
}
