using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.TransitionLegalCaseStatus;

/// <summary>
/// Handles transitioning a legal case to a new status.
/// Enforces state machine rules, contract terminal state gate for Closed,
/// and sets status-specific fields before persisting.
/// </summary>
public sealed class TransitionLegalCaseStatusCommandHandler
    : IRequestHandler<TransitionLegalCaseStatusCommand, LegalCaseDto>
{
    private readonly IRepository<LegalCase> _legalCaseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly ILegalCaseStateMachine _stateMachine;
    private readonly IPublisher _publisher;

    /// <summary>
    /// Terminal contract statuses that allow a legal case to be closed.
    /// </summary>
    private static readonly HashSet<LegalContractStatus> TerminalContractStatuses = new()
    {
        LegalContractStatus.Completed,
        LegalContractStatus.Terminated,
        LegalContractStatus.Expired,
        LegalContractStatus.Closed,
        LegalContractStatus.Cancelled
    };

    public TransitionLegalCaseStatusCommandHandler(
        IRepository<LegalCase> legalCaseRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        ILegalCaseStateMachine stateMachine,
        IPublisher publisher)
    {
        _legalCaseRepository = legalCaseRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
        _publisher = publisher;
    }

    public async Task<LegalCaseDto> Handle(
        TransitionLegalCaseStatusCommand request,
        CancellationToken cancellationToken)
    {
        // Retrieve existing LegalCase with Contracts for the Closed gate check
        var legalCase = await _legalCaseRepository.Query()
            .Include(lc => lc.Contracts)
            .FirstOrDefaultAsync(lc => lc.Id == request.Id, cancellationToken);

        if (legalCase is null)
        {
            throw new EntityNotFoundException(nameof(LegalCase), request.Id);
        }

        var previousStatus = legalCase.Status;

        // Validate transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(previousStatus, request.NewStatus);

        // WHEN NewStatus = Closed: all linked contracts must be in a terminal state
        if (request.NewStatus == LegalCaseStatus.Closed)
        {
            ValidateAllContractsInTerminalState(legalCase);
        }

        // Apply the new status
        legalCase.Status = request.NewStatus;

        // Set status-specific fields
        switch (request.NewStatus)
        {
            case LegalCaseStatus.Resolved:
                legalCase.ResolutionSummary = request.ResolutionSummary;
                legalCase.ResolutionDate = request.ResolutionDate;
                break;

            case LegalCaseStatus.Escalated:
                legalCase.EscalationReason = request.EscalationReason;
                break;

            case LegalCaseStatus.OnHold:
                legalCase.HoldReason = request.HoldReason;
                break;
        }

        // Set audit fields
        legalCase.UpdatedAt = DateTime.UtcNow;
        legalCase.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _legalCaseRepository.Update(legalCase);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Raise domain event
        await _publisher.Publish(new LegalCaseStatusChangedEvent
        {
            LegalCaseId = legalCase.Id,
            CaseReference = legalCase.CaseReference,
            PreviousStatus = previousStatus,
            NewStatus = request.NewStatus,
            TransitionReason = request.Reason,
            UserId = _currentUserService.UserId ?? string.Empty,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        return _mapper.Map<LegalCaseDto>(legalCase);
    }

    /// <summary>
    /// Validates that ALL linked contracts are in a terminal state (Completed, Terminated, Expired, Closed, Cancelled)
    /// before allowing the legal case to transition to Closed.
    /// </summary>
    private static void ValidateAllContractsInTerminalState(LegalCase legalCase)
    {
        var nonTerminalContracts = legalCase.Contracts
            .Where(c => !TerminalContractStatuses.Contains(c.Status))
            .ToList();

        if (nonTerminalContracts.Count > 0)
        {
            var contractRefs = string.Join(", ",
                nonTerminalContracts.Select(c => $"{c.ContractReference} ({c.Status})"));

            throw new BusinessRuleViolationException(
                "AllContractsMustBeTerminal",
                $"Cannot close legal case while contracts are still active. " +
                $"Non-terminal contracts: {contractRefs}.");
        }
    }
}
