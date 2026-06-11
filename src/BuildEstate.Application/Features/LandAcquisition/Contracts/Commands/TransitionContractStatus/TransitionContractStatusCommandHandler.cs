using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.TransitionContractStatus;

/// <summary>
/// Handles contract status transitions using the IContractStateMachine.
/// When transitioning to Exchanged, validates that DepositAmount is provided and stores it.
/// </summary>
public sealed class TransitionContractStatusCommandHandler : IRequestHandler<TransitionContractStatusCommand, ContractDto>
{
    private readonly IRepository<Contract> _contractRepository;
    private readonly IContractStateMachine _contractStateMachine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public TransitionContractStatusCommandHandler(
        IRepository<Contract> contractRepository,
        IContractStateMachine contractStateMachine,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _contractRepository = contractRepository;
        _contractStateMachine = contractStateMachine;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<ContractDto> Handle(TransitionContractStatusCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepository.GetByIdAsync(request.ContractId, cancellationToken);
        if (contract is null)
        {
            throw new EntityNotFoundException(nameof(Contract), request.ContractId);
        }

        // Validate the transition using the state machine (throws if invalid)
        _contractStateMachine.ValidateTransition(contract.Status, request.TargetStatus);

        // Business rule: DepositAmount must be > 0 when transitioning to Exchanged
        if (request.TargetStatus == ContractStatus.Exchanged && (request.DepositAmount is null || request.DepositAmount <= 0))
        {
            throw new BusinessRuleViolationException(
                "DepositRequiredForExchange",
                "A deposit amount greater than zero is required when transitioning to Exchanged status.");
        }

        // Apply the transition
        contract.Status = request.TargetStatus;

        // Store deposit amount if provided
        if (request.DepositAmount.HasValue)
        {
            contract.DepositAmount = request.DepositAmount.Value;
        }

        // Set audit fields
        contract.UpdatedAt = DateTime.UtcNow;
        contract.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _contractRepository.Update(contract);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ContractDto>(contract);
    }
}
