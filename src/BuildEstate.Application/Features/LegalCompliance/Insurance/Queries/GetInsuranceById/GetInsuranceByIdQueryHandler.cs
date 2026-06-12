using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Queries.GetInsuranceById;

/// <summary>
/// Handles retrieval of a single insurance record with the linked LegalCase
/// eager-loaded for the detail view. Includes permitted status transitions
/// from the insurance state machine, calculated DaysUntilExpiry, and LegalCaseReference.
/// Throws EntityNotFoundException if the record does not exist.
/// </summary>
public sealed class GetInsuranceByIdQueryHandler
    : IRequestHandler<GetInsuranceByIdQuery, InsuranceRecordDetailDto>
{
    private readonly IRepository<InsuranceRecord> _repository;
    private readonly IInsuranceStateMachine _stateMachine;

    public GetInsuranceByIdQueryHandler(
        IRepository<InsuranceRecord> repository,
        IInsuranceStateMachine stateMachine)
    {
        _repository = repository;
        _stateMachine = stateMachine;
    }

    public async Task<InsuranceRecordDetailDto> Handle(
        GetInsuranceByIdQuery request,
        CancellationToken cancellationToken)
    {
        var insuranceRecord = await _repository
            .Query()
            .AsNoTracking()
            .Include(x => x.LegalCase)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (insuranceRecord is null)
        {
            throw new EntityNotFoundException(nameof(InsuranceRecord), request.Id);
        }

        var permittedTransitions = _stateMachine.GetPermittedTransitions(insuranceRecord.Status);
        var now = DateTime.UtcNow;

        return new InsuranceRecordDetailDto
        {
            Id = insuranceRecord.Id,
            PolicyNumber = insuranceRecord.PolicyNumber,
            Insurer = insuranceRecord.Insurer,
            CoverageType = insuranceRecord.CoverageType,
            CoverAmount = insuranceRecord.CoverAmount,
            Premium = insuranceRecord.Premium,
            Currency = insuranceRecord.Currency,
            StartDate = insuranceRecord.StartDate,
            ExpiryDate = insuranceRecord.ExpiryDate,
            Status = insuranceRecord.Status,
            PreviousPolicyId = insuranceRecord.PreviousPolicyId,
            OpportunityId = insuranceRecord.OpportunityId,
            LegalCaseId = insuranceRecord.LegalCaseId,
            CreatedAt = insuranceRecord.CreatedAt,
            CreatedBy = insuranceRecord.CreatedBy,
            UpdatedAt = insuranceRecord.UpdatedAt,
            PermittedTransitions = permittedTransitions.ToList(),
            DaysUntilExpiry = (int)(insuranceRecord.ExpiryDate - now).TotalDays,
            LegalCaseReference = insuranceRecord.LegalCase?.CaseReference
        };
    }
}
