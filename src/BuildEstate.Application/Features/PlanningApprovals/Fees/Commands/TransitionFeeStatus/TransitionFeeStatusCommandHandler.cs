using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Application.Settings;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.TransitionFeeStatus;

/// <summary>
/// Handles transitioning a PlanningFee to a new PaymentStatus.
/// Validates the transition via the fee status state machine, enforces the threshold rule
/// (amounts above threshold cannot skip AwaitingApproval → Approved → Paid),
/// and persists the updated fee.
/// </summary>
public sealed class TransitionFeeStatusCommandHandler
    : IRequestHandler<TransitionFeeStatusCommand, FeeDto>
{
    private readonly IRepository<PlanningFee> _feeRepository;
    private readonly IFeeStatusStateMachine _stateMachine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly PlanningFeeSettings _feeSettings;
    private readonly ILogger<TransitionFeeStatusCommandHandler> _logger;

    public TransitionFeeStatusCommandHandler(
        IRepository<PlanningFee> feeRepository,
        IFeeStatusStateMachine stateMachine,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IOptions<PlanningFeeSettings> feeSettings,
        ILogger<TransitionFeeStatusCommandHandler> logger)
    {
        _feeRepository = feeRepository;
        _stateMachine = stateMachine;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _feeSettings = feeSettings.Value;
        _logger = logger;
    }

    public async Task<FeeDto> Handle(
        TransitionFeeStatusCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Load the PlanningFee by Id
        var fee = await _feeRepository.GetByIdAsync(request.FeeId, cancellationToken);

        if (fee is null)
        {
            throw new EntityNotFoundException(nameof(PlanningFee), request.FeeId);
        }

        var currentStatus = fee.PaymentStatus;

        // 2. Validate transition via state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(currentStatus, request.NewStatus);

        // 3. Enforce threshold rule: fees above threshold cannot go Pending → Paid directly
        EnforceThresholdRule(fee, currentStatus, request.NewStatus);

        // 4. Update PaymentStatus and audit fields
        fee.PaymentStatus = request.NewStatus;
        fee.UpdatedAt = DateTime.UtcNow;
        fee.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        // 5. Save changes
        _feeRepository.Update(fee);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 6. Log audit trail
        _logger.LogInformation(
            "Planning fee {FeeId} status transitioned from {PreviousStatus} to {NewStatus} by {UserId} at {Timestamp}",
            fee.Id,
            currentStatus,
            request.NewStatus,
            _currentUserService.UserId,
            DateTime.UtcNow);

        return _mapper.Map<FeeDto>(fee);
    }

    /// <summary>
    /// Enforces the threshold rule: fees with Amount above the configured threshold
    /// cannot transition directly from Pending to Paid. They must go through
    /// AwaitingApproval → Approved → Paid.
    /// </summary>
    private void EnforceThresholdRule(PlanningFee fee, PaymentStatus currentStatus, PaymentStatus newStatus)
    {
        if (fee.Amount > _feeSettings.ApprovalThreshold
            && currentStatus == PaymentStatus.Pending
            && newStatus == PaymentStatus.Paid)
        {
            throw new BusinessRuleViolationException(
                "FeeThresholdEnforcement",
                $"Fees exceeding {_feeSettings.ApprovalThreshold:N2} cannot transition directly from Pending to Paid. " +
                "The fee must go through AwaitingApproval → Approved → Paid.");
        }
    }
}
