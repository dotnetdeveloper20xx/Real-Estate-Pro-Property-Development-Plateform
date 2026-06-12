using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.RenewInsuranceRecord;

/// <summary>
/// Handles renewal of an existing InsuranceRecord.
/// Validates that the existing record is in ExpiringSoon or Expired status,
/// transitions the old record to Renewed, creates a new InsuranceRecord linked
/// via PreviousPolicyId with carried-forward fields, and returns the new record.
/// </summary>
public sealed class RenewInsuranceRecordCommandHandler
    : IRequestHandler<RenewInsuranceRecordCommand, InsuranceRecordDto>
{
    private readonly IRepository<InsuranceRecord> _insuranceRecordRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IInsuranceStateMachine _stateMachine;

    public RenewInsuranceRecordCommandHandler(
        IRepository<InsuranceRecord> insuranceRecordRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IInsuranceStateMachine stateMachine)
    {
        _insuranceRecordRepository = insuranceRecordRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
    }

    public async Task<InsuranceRecordDto> Handle(
        RenewInsuranceRecordCommand request,
        CancellationToken cancellationToken)
    {
        var existingRecord = await _insuranceRecordRepository.GetByIdAsync(request.Id, cancellationToken);
        if (existingRecord is null)
        {
            throw new EntityNotFoundException(nameof(InsuranceRecord), request.Id);
        }

        // Validate transition: only ExpiringSoon or Expired can transition to Renewed.
        // The state machine will throw InvalidStateTransitionException if the transition is invalid.
        _stateMachine.ValidateTransition(existingRecord.Status, InsuranceStatus.Renewed);

        // Transition old record to Renewed
        existingRecord.Status = InsuranceStatus.Renewed;
        existingRecord.UpdatedAt = DateTime.UtcNow;
        existingRecord.UpdatedBy = _currentUserService.UserId ?? string.Empty;
        _insuranceRecordRepository.Update(existingRecord);

        // Create new InsuranceRecord carrying forward from the old record
        var renewedRecord = new InsuranceRecord
        {
            PreviousPolicyId = existingRecord.Id,
            PolicyNumber = existingRecord.PolicyNumber,
            Insurer = existingRecord.Insurer,
            CoverageType = existingRecord.CoverageType,
            CoverAmount = request.NewCoverAmount,
            Premium = request.NewPremium,
            Currency = request.Currency,
            StartDate = request.NewStartDate,
            ExpiryDate = request.NewExpiryDate,
            Status = InsuranceStatus.Active,
            OpportunityId = existingRecord.OpportunityId,
            LegalCaseId = existingRecord.LegalCaseId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _insuranceRecordRepository.AddAsync(renewedRecord, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<InsuranceRecordDto>(renewedRecord);
    }
}
