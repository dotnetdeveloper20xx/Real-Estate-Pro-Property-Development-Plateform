using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.TransitionAppealStatus;

/// <summary>
/// Handles transitioning a planning appeal to a new status.
/// Validates via the appeal state machine, enforces decision data requirements
/// for Allowed/Dismissed transitions, and raises AppealAllowedDomainEvent when Allowed.
/// </summary>
public sealed class TransitionAppealStatusCommandHandler
    : IRequestHandler<TransitionAppealStatusCommand, AppealDto>
{
    private readonly IRepository<PlanningAppeal> _appealRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IAppealStatusStateMachine _stateMachine;
    private readonly IPublisher _publisher;

    public TransitionAppealStatusCommandHandler(
        IRepository<PlanningAppeal> appealRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IAppealStatusStateMachine stateMachine,
        IPublisher publisher)
    {
        _appealRepository = appealRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
        _publisher = publisher;
    }

    public async Task<AppealDto> Handle(
        TransitionAppealStatusCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Load the appeal by ID
        var appeal = await _appealRepository.GetByIdAsync(request.AppealId, cancellationToken);

        if (appeal is null)
        {
            throw new EntityNotFoundException(nameof(PlanningAppeal), request.AppealId);
        }

        // 2. Validate the transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(appeal.Status, request.NewStatus);

        // 3. Apply decision-specific data when transitioning to Allowed or Dismissed
        if (request.NewStatus == AppealStatus.Allowed || request.NewStatus == AppealStatus.Dismissed)
        {
            appeal.DecisionDate = request.DecisionDate;
            appeal.DecisionSummary = request.DecisionSummary;
        }

        // 4. Apply AppealOutcomeType when transitioning to Allowed
        if (request.NewStatus == AppealStatus.Allowed)
        {
            appeal.AppealOutcomeType = request.AppealOutcomeType;
        }

        // 5. Apply the status transition
        appeal.Status = request.NewStatus;
        appeal.UpdatedAt = DateTime.UtcNow;
        appeal.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _appealRepository.Update(appeal);

        // 6. Raise domain event when transitioning to Allowed
        if (request.NewStatus == AppealStatus.Allowed)
        {
            appeal.RaiseAppealAllowedEvent(
                request.AppealOutcomeType!.Value,
                request.DecisionDate!.Value,
                request.DecisionSummary!);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 7. Publish domain event via MediatR for cross-cutting handlers
        if (request.NewStatus == AppealStatus.Allowed)
        {
            await _publisher.Publish(new AppealAllowedDomainEvent
            {
                AppealId = appeal.Id,
                ApplicationId = appeal.ApplicationId,
                OutcomeType = request.AppealOutcomeType!.Value,
                DecisionDate = request.DecisionDate!.Value,
                DecisionSummary = request.DecisionSummary!
            }, cancellationToken);
        }

        return _mapper.Map<AppealDto>(appeal);
    }
}
