using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Queries.GetAuditRecordById;

/// <summary>
/// Handles retrieval of a single audit record by Id.
/// Resolves permitted status transitions from the state machine,
/// calculates DaysUntilActionDue, and resolves linked entity display names
/// (LegalCaseReference, ComplianceRequirementName).
/// Throws EntityNotFoundException if the audit record does not exist.
/// </summary>
public sealed class GetAuditRecordByIdQueryHandler
    : IRequestHandler<GetAuditRecordByIdQuery, AuditRecordDetailDto>
{
    private readonly IRepository<AuditRecord> _repository;
    private readonly IRepository<LegalCase> _legalCaseRepository;
    private readonly IRepository<ComplianceRequirement> _complianceRequirementRepository;
    private readonly IAuditRecordStateMachine _stateMachine;

    public GetAuditRecordByIdQueryHandler(
        IRepository<AuditRecord> repository,
        IRepository<LegalCase> legalCaseRepository,
        IRepository<ComplianceRequirement> complianceRequirementRepository,
        IAuditRecordStateMachine stateMachine)
    {
        _repository = repository;
        _legalCaseRepository = legalCaseRepository;
        _complianceRequirementRepository = complianceRequirementRepository;
        _stateMachine = stateMachine;
    }

    public async Task<AuditRecordDetailDto> Handle(
        GetAuditRecordByIdQuery request,
        CancellationToken cancellationToken)
    {
        var auditRecord = await _repository
            .Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (auditRecord is null)
        {
            throw new EntityNotFoundException(nameof(AuditRecord), request.Id);
        }

        var permittedTransitions = _stateMachine.GetPermittedTransitions(auditRecord.Status);

        // Resolve linked entity display names
        string? legalCaseReference = null;
        if (auditRecord.LegalCaseId.HasValue)
        {
            legalCaseReference = await _legalCaseRepository
                .Query()
                .AsNoTracking()
                .Where(lc => lc.Id == auditRecord.LegalCaseId.Value)
                .Select(lc => lc.CaseReference)
                .FirstOrDefaultAsync(cancellationToken);
        }

        string? complianceRequirementName = null;
        if (auditRecord.ComplianceRequirementId.HasValue)
        {
            complianceRequirementName = await _complianceRequirementRepository
                .Query()
                .AsNoTracking()
                .Where(cr => cr.Id == auditRecord.ComplianceRequirementId.Value)
                .Select(cr => cr.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        // Calculate days until action due
        int? daysUntilActionDue = null;
        if (auditRecord.ActionDueDate.HasValue)
        {
            daysUntilActionDue = (int)(auditRecord.ActionDueDate.Value - DateTime.UtcNow).TotalDays;
        }

        return new AuditRecordDetailDto
        {
            Id = auditRecord.Id,
            AuditType = auditRecord.AuditType.ToString(),
            Scope = auditRecord.Scope,
            AuditorName = auditRecord.AuditorName,
            AuditDate = auditRecord.AuditDate,
            Status = auditRecord.Status.ToString(),
            Findings = auditRecord.Findings,
            RiskRating = auditRecord.RiskRating?.ToString(),
            Recommendations = auditRecord.Recommendations,
            ActionDueDate = auditRecord.ActionDueDate,
            IsOverdue = auditRecord.IsOverdue,
            LegalCaseId = auditRecord.LegalCaseId,
            ComplianceRequirementId = auditRecord.ComplianceRequirementId,
            CreatedAt = auditRecord.CreatedAt,
            CreatedBy = auditRecord.CreatedBy,
            UpdatedAt = auditRecord.UpdatedAt,
            PermittedTransitions = permittedTransitions.ToList(),
            DaysUntilActionDue = daysUntilActionDue,
            LegalCaseReference = legalCaseReference,
            ComplianceRequirementName = complianceRequirementName
        };
    }
}
