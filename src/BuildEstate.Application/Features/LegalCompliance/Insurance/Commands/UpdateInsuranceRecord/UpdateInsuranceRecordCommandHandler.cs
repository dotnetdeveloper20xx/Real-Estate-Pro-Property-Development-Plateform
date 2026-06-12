using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.UpdateInsuranceRecord;

/// <summary>
/// Handles updating an existing InsuranceRecord entity.
/// Applies only non-null fields (partial update pattern), sets audit fields, and persists.
/// Throws EntityNotFoundException if the insurance record does not exist.
/// </summary>
public sealed class UpdateInsuranceRecordCommandHandler
    : IRequestHandler<UpdateInsuranceRecordCommand, InsuranceRecordDto>
{
    private readonly IRepository<InsuranceRecord> _insuranceRecordRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateInsuranceRecordCommandHandler(
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

    public async Task<InsuranceRecordDto> Handle(
        UpdateInsuranceRecordCommand request,
        CancellationToken cancellationToken)
    {
        var insuranceRecord = await _insuranceRecordRepository.GetByIdAsync(request.Id, cancellationToken);
        if (insuranceRecord is null)
        {
            throw new EntityNotFoundException(nameof(InsuranceRecord), request.Id);
        }

        // Apply only non-null fields (partial update)
        if (request.PolicyNumber is not null)
            insuranceRecord.PolicyNumber = request.PolicyNumber;

        if (request.Insurer is not null)
            insuranceRecord.Insurer = request.Insurer;

        if (request.CoverAmount.HasValue)
            insuranceRecord.CoverAmount = request.CoverAmount.Value;

        if (request.Premium.HasValue)
            insuranceRecord.Premium = request.Premium.Value;

        if (request.Currency is not null)
            insuranceRecord.Currency = request.Currency;

        if (request.ExpiryDate.HasValue)
            insuranceRecord.ExpiryDate = request.ExpiryDate.Value;

        insuranceRecord.UpdatedAt = DateTime.UtcNow;
        insuranceRecord.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _insuranceRecordRepository.Update(insuranceRecord);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<InsuranceRecordDto>(insuranceRecord);
    }
}
