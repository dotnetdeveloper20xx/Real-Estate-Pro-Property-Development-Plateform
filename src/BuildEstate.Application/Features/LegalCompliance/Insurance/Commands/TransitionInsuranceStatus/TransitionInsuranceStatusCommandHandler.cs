using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.TransitionInsuranceStatus;

/// <summary>
/// Handles transitioning an insurance record to a new status.
/// Validates the transition using IInsuranceStateMachine and raises
/// InsuranceExpiringEvent when transitioning to ExpiringSoon or Expired.
/// </summary>
public sealed class TransitionInsuranceStatusCommandHandler
    : IRequestHandler<TransitionInsuranceStatusCommand, InsuranceRecordDto>
{
    private readonly IRepository<InsuranceRecord> _insuranceRecordRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IInsuranceStateMachine _stateMachine;
    private readonly IPublisher _publisher;

    public TransitionInsuranceStatusCommandHandler(
        IRepository<InsuranceRecord> insuranceRecordRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IInsuranceStateMachine stateMachine,
        IPublisher publisher)
    {
        _insuranceRecordRepository = insuranceRecordRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
        _publisher = publisher;
    }

    public async Task<InsuranceRecordDto> Handle(
        TransitionInsuranceStatusCommand request,
        CancellationToken cancellationToken)
    {
        var insuranceRecord = await _insuranceRecordRepository.GetByIdAsync(request.Id, cancellationToken);
        if (insuranceRecord is null)
        {
            throw new EntityNotFoundException(nameof(InsuranceRecord), request.Id);
        }

        var previousStatus = insuranceRecord.Status;

        // Validate transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(previousStatus, request.NewStatus);

        // Apply the new status
        insuranceRecord.Status = request.NewStatus;

        // Set audit fields
        insuranceRecord.UpdatedAt = DateTime.UtcNow;
        insuranceRecord.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _insuranceRecordRepository.Update(insuranceRecord);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Raise InsuranceExpiringEvent for ExpiringSoon or Expired transitions
        if (request.NewStatus is InsuranceStatus.ExpiringSoon or InsuranceStatus.Expired)
        {
            await _publisher.Publish(new InsuranceExpiringEvent
            {
                InsuranceRecordId = insuranceRecord.Id,
                PolicyNumber = insuranceRecord.PolicyNumber,
                ExpiryDate = insuranceRecord.ExpiryDate,
                InsuranceStatus = request.NewStatus,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }

        return _mapper.Map<InsuranceRecordDto>(insuranceRecord);
    }
}
