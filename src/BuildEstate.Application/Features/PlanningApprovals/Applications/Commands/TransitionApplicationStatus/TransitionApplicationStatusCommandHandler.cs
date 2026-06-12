using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.TransitionApplicationStatus;

/// <summary>
/// Handles transitioning a PlanningApplication to a new status.
/// Validates the transition via the state machine, enforces conditional data requirements,
/// updates relevant fields, raises a domain event, and persists changes.
/// </summary>
public sealed class TransitionApplicationStatusCommandHandler
    : IRequestHandler<TransitionApplicationStatusCommand, ApplicationDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IPlanningStatusStateMachine _stateMachine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly ILogger<TransitionApplicationStatusCommandHandler> _logger;

    public TransitionApplicationStatusCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IPlanningStatusStateMachine stateMachine,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        ILogger<TransitionApplicationStatusCommandHandler> logger)
    {
        _applicationRepository = applicationRepository;
        _stateMachine = stateMachine;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ApplicationDto> Handle(
        TransitionApplicationStatusCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Load the application
        var application = await _applicationRepository.GetByIdAsync(request.ApplicationId, cancellationToken);

        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        var previousStatus = application.Status;

        // 2. Validate transition via state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(previousStatus, request.NewStatus);

        // 3. Enforce conditional data requirements based on target status
        EnforceConditionalData(request);

        // 4. Update status and relevant fields
        application.Status = request.NewStatus;
        application.UpdatedAt = DateTime.UtcNow;
        application.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        ApplyStatusSpecificFields(application, request);

        // 5. Raise domain event
        application.RaiseStatusChangedEvent(
            previousStatus,
            request.NewStatus,
            _currentUserService.UserId ?? string.Empty,
            DateTime.UtcNow);

        // 6. Persist changes
        _applicationRepository.Update(application);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 7. Log audit trail
        _logger.LogInformation(
            "Planning application {ApplicationId} status transitioned from {PreviousStatus} to {NewStatus} by {UserId} at {Timestamp}",
            application.Id,
            previousStatus,
            request.NewStatus,
            _currentUserService.UserId,
            DateTime.UtcNow);

        return _mapper.Map<ApplicationDto>(application);
    }

    /// <summary>
    /// Enforces conditional data requirements based on the target status.
    /// Throws BusinessRuleViolationException if required data is missing or invalid.
    /// </summary>
    private static void EnforceConditionalData(TransitionApplicationStatusCommand request)
    {
        switch (request.NewStatus)
        {
            case PlanningApplicationStatus.Submitted:
                ValidateApplicationReference(request.ApplicationReference);
                break;

            case PlanningApplicationStatus.Approved:
            case PlanningApplicationStatus.ApprovedWithConditions:
            case PlanningApplicationStatus.Refused:
                ValidateDecisionDate(request.DecisionDate);
                break;

            case PlanningApplicationStatus.Withdrawn:
                ValidateWithdrawalReason(request.WithdrawalReason);
                break;
        }
    }

    private static void ValidateApplicationReference(string? applicationReference)
    {
        if (string.IsNullOrWhiteSpace(applicationReference))
        {
            throw new BusinessRuleViolationException(
                "ApplicationReferenceRequired",
                "ApplicationReference is required when transitioning to Submitted.");
        }

        var trimmed = applicationReference.Trim();
        if (trimmed.Length < 5 || trimmed.Length > 50)
        {
            throw new BusinessRuleViolationException(
                "ApplicationReferenceLength",
                "ApplicationReference must be between 5 and 50 characters.");
        }
    }

    private static void ValidateDecisionDate(DateTime? decisionDate)
    {
        if (!decisionDate.HasValue)
        {
            throw new BusinessRuleViolationException(
                "DecisionDateRequired",
                "DecisionDate is required when transitioning to Approved, ApprovedWithConditions, or Refused.");
        }

        if (decisionDate.Value.Date > DateTime.UtcNow.Date)
        {
            throw new BusinessRuleViolationException(
                "DecisionDateNotFuture",
                "DecisionDate must not be in the future.");
        }
    }

    private static void ValidateWithdrawalReason(string? withdrawalReason)
    {
        if (string.IsNullOrWhiteSpace(withdrawalReason))
        {
            throw new BusinessRuleViolationException(
                "WithdrawalReasonRequired",
                "WithdrawalReason is required when transitioning to Withdrawn.");
        }

        if (withdrawalReason.Trim().Length < 10)
        {
            throw new BusinessRuleViolationException(
                "WithdrawalReasonLength",
                "WithdrawalReason must be at least 10 characters.");
        }
    }

    /// <summary>
    /// Applies status-specific field updates to the application entity.
    /// </summary>
    private static void ApplyStatusSpecificFields(
        PlanningApplication application,
        TransitionApplicationStatusCommand request)
    {
        switch (request.NewStatus)
        {
            case PlanningApplicationStatus.Submitted:
                application.ApplicationReference = request.ApplicationReference!.Trim();
                application.SubmissionDate = DateTime.UtcNow;
                break;

            case PlanningApplicationStatus.Approved:
            case PlanningApplicationStatus.ApprovedWithConditions:
            case PlanningApplicationStatus.Refused:
                application.DecisionDate = request.DecisionDate;
                application.ActualDecisionDate = request.DecisionDate;
                break;

            case PlanningApplicationStatus.Withdrawn:
                application.WithdrawalReason = request.WithdrawalReason!.Trim();
                break;
        }
    }
}
