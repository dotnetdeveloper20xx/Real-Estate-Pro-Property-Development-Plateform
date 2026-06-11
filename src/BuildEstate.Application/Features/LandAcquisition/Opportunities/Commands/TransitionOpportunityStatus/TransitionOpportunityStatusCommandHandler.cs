using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;

/// <summary>
/// Handles transitioning a land opportunity to a new status.
/// Enforces state machine rules, withdrawal reason, pending approval checks,
/// and due diligence completion gate before DueDiligence → OfferMade.
/// </summary>
public sealed class TransitionOpportunityStatusCommandHandler
    : IRequestHandler<TransitionOpportunityStatusCommand, OpportunityDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IOpportunityStateMachine _stateMachine;
    private readonly IPublisher _publisher;

    public TransitionOpportunityStatusCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IOpportunityStateMachine stateMachine,
        IPublisher publisher)
    {
        _opportunityRepository = opportunityRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
        _publisher = publisher;
    }

    public async Task<OpportunityDto> Handle(
        TransitionOpportunityStatusCommand request,
        CancellationToken cancellationToken)
    {
        // Load opportunity with DueDiligences and ApprovalRequests for gate checks
        var opportunity = await _opportunityRepository.Query()
            .Include(o => o.DueDiligences)
            .Include(o => o.ApprovalRequests)
            .FirstOrDefaultAsync(o => o.Id == request.OpportunityId, cancellationToken);

        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        var previousStatus = opportunity.Status;

        // Validate the transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(previousStatus, request.TargetStatus);

        // If target is Withdrawn, set the withdrawal reason
        if (request.TargetStatus == OpportunityStatus.Withdrawn)
        {
            opportunity.WithdrawalReason = request.WithdrawalReason;
        }

        // Check for pending approval requests — block transition while any are pending
        var hasPendingApprovals = opportunity.ApprovalRequests
            .Any(ar => ar.Status == ApprovalStatus.Pending);

        if (hasPendingApprovals)
        {
            throw new ApprovalRequiredException(
                opportunity.Id,
                "FinanceDirector");
        }

        // Due Diligence completion gate: DueDiligence → OfferMade
        if (previousStatus == OpportunityStatus.DueDiligence
            && request.TargetStatus == OpportunityStatus.OfferMade)
        {
            ValidateDueDiligenceCompletionGate(opportunity);
        }

        // Apply the transition
        opportunity.Status = request.TargetStatus;
        opportunity.UpdatedAt = DateTime.UtcNow;
        opportunity.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _opportunityRepository.Update(opportunity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Dispatch domain event notification on success
        await _publisher.Publish(new OpportunityStatusTransitionedNotification
        {
            OpportunityId = opportunity.Id,
            PreviousStatus = previousStatus,
            NewStatus = request.TargetStatus,
            TransitionedBy = _currentUserService.UserId ?? string.Empty,
            TransitionedAt = DateTime.UtcNow
        }, cancellationToken);

        return _mapper.Map<OpportunityDto>(opportunity);
    }

    /// <summary>
    /// Validates that all mandatory due diligence checks (Legal, Environmental, Planning)
    /// have been completed before allowing transition to OfferMade.
    /// </summary>
    private static void ValidateDueDiligenceCompletionGate(LandOpportunity opportunity)
    {
        var mandatoryTypes = new[]
        {
            DueDiligenceType.Legal,
            DueDiligenceType.Environmental,
            DueDiligenceType.Planning
        };

        var missingOrIncomplete = new List<string>();

        foreach (var mandatoryType in mandatoryTypes)
        {
            var ddCheck = opportunity.DueDiligences
                .FirstOrDefault(dd => dd.Type == mandatoryType);

            if (ddCheck is null || ddCheck.Status != DueDiligenceStatus.Completed)
            {
                missingOrIncomplete.Add(mandatoryType.ToString());
            }
        }

        if (missingOrIncomplete.Count > 0)
        {
            throw new BusinessRuleViolationException(
                "DueDiligenceCompletionGate",
                $"All mandatory due diligence checks must be completed before transitioning to Offer Made. " +
                $"Incomplete or missing: {string.Join(", ", missingOrIncomplete)}.");
        }
    }
}
