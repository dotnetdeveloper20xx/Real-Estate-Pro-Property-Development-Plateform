using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Application.Settings;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.TransitionContractStatus;

/// <summary>
/// Handles transitioning a contract to a new status.
/// Validates the transition via the contract state machine, enforces the high-value
/// threshold rule requiring Finance_Director approval for Draft→UnderReview,
/// sets status-specific fields, and raises a ContractStatusChangedEvent.
/// </summary>
public sealed class TransitionContractStatusCommandHandler
    : IRequestHandler<TransitionContractStatusCommand, ContractDto>
{
    private readonly IRepository<Contract> _contractRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly ILegalContractStateMachine _stateMachine;
    private readonly IPublisher _publisher;
    private readonly LegalComplianceSettings _settings;

    private const string FinanceDirectorRole = "Finance_Director";

    public TransitionContractStatusCommandHandler(
        IRepository<Contract> contractRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        ILegalContractStateMachine stateMachine,
        IPublisher publisher,
        IOptions<LegalComplianceSettings> settings)
    {
        _contractRepository = contractRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
        _publisher = publisher;
        _settings = settings.Value;
    }

    public async Task<ContractDto> Handle(
        TransitionContractStatusCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Retrieve contract by Id with LegalCase included
        var contract = await _contractRepository.Query()
            .Include(c => c.LegalCase)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (contract is null)
        {
            throw new EntityNotFoundException(nameof(Contract), request.Id);
        }

        var previousStatus = contract.Status;

        // 2. Validate transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(previousStatus, request.NewStatus);

        // 3. For Draft→UnderReview with high-value: require Finance_Director role
        if (previousStatus == LegalContractStatus.Draft
            && request.NewStatus == LegalContractStatus.UnderReview
            && contract.ContractValue > _settings.HighValueContractThreshold)
        {
            if (!_currentUserService.IsInRole(FinanceDirectorRole))
            {
                throw new BusinessRuleViolationException(
                    "HighValueContractApproval",
                    $"Contracts with value exceeding {_settings.HighValueContractThreshold:N2} require " +
                    $"Finance_Director role to transition from Draft to UnderReview.");
            }
        }

        // 4. Apply the new status
        contract.Status = request.NewStatus;

        // 5. Set status-specific fields
        switch (request.NewStatus)
        {
            case LegalContractStatus.Executed:
                contract.ExecutionDate = request.ExecutionDate;
                contract.SignatoryNames = request.SignatoryNames;
                break;

            case LegalContractStatus.Terminated:
                contract.TerminationReason = request.TerminationReason;
                contract.TerminationDate = request.TerminationDate;
                break;

            case LegalContractStatus.Approved:
                contract.ApproverUserId = _currentUserService.UserId;
                contract.ApprovalTimestamp = DateTime.UtcNow;
                contract.ApprovalNotes = request.ApprovalNotes;
                break;
        }

        // 6. Set audit fields
        contract.UpdatedAt = DateTime.UtcNow;
        contract.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        // 7. Persist changes
        _contractRepository.Update(contract);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 8. Raise domain event
        await _publisher.Publish(new ContractStatusChangedEvent
        {
            ContractId = contract.Id,
            ContractReference = contract.ContractReference,
            PreviousStatus = previousStatus,
            NewStatus = request.NewStatus,
            UserId = _currentUserService.UserId ?? string.Empty,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        return _mapper.Map<ContractDto>(contract);
    }
}
