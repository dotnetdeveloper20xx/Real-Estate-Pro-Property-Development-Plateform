using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.CreateInsuranceRecord;

/// <summary>
/// Handles creation of a new InsuranceRecord entity.
/// Enforces PolicyNumber uniqueness among active (Status = Active) records,
/// sets Status to Active, assigns audit fields, and persists.
/// </summary>
public sealed class CreateInsuranceRecordCommandHandler : IRequestHandler<CreateInsuranceRecordCommand, InsuranceRecordDto>
{
    private readonly IRepository<InsuranceRecord> _insuranceRecordRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateInsuranceRecordCommandHandler(
        IRepository<InsuranceRecord> insuranceRecordRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _insuranceRecordRepository = insuranceRecordRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<InsuranceRecordDto> Handle(CreateInsuranceRecordCommand request, CancellationToken cancellationToken)
    {
        // Check PolicyNumber uniqueness among active insurance records
        var duplicateExists = await _insuranceRecordRepository.Query()
            .AnyAsync(r =>
                r.PolicyNumber == request.PolicyNumber &&
                r.Status == InsuranceStatus.Active &&
                !r.IsDeleted,
                cancellationToken);

        if (duplicateExists)
        {
            throw new DuplicateEntityException(
                nameof(InsuranceRecord),
                "PolicyNumber",
                request.PolicyNumber);
        }

        var insuranceRecord = new InsuranceRecord
        {
            PolicyNumber = request.PolicyNumber,
            Insurer = request.Insurer,
            CoverageType = request.CoverageType,
            CoverAmount = request.CoverAmount,
            Premium = request.Premium,
            Currency = request.Currency,
            StartDate = request.StartDate,
            ExpiryDate = request.ExpiryDate,
            Status = InsuranceStatus.Active,
            OpportunityId = request.OpportunityId,
            LegalCaseId = request.LegalCaseId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _insuranceRecordRepository.AddAsync(insuranceRecord, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<InsuranceRecordDto>(insuranceRecord);
    }
}
