using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseById;

/// <summary>
/// Handles retrieval of a single legal case with all navigation properties
/// eager-loaded for the detail view. Includes permitted status transitions
/// from the state machine.
/// Throws EntityNotFoundException if the case does not exist.
/// </summary>
public sealed class GetLegalCaseByIdQueryHandler
    : IRequestHandler<GetLegalCaseByIdQuery, LegalCaseDetailDto>
{
    private readonly IRepository<LegalCase> _repository;
    private readonly ILegalCaseStateMachine _stateMachine;

    public GetLegalCaseByIdQueryHandler(
        IRepository<LegalCase> repository,
        ILegalCaseStateMachine stateMachine)
    {
        _repository = repository;
        _stateMachine = stateMachine;
    }

    public async Task<LegalCaseDetailDto> Handle(
        GetLegalCaseByIdQuery request,
        CancellationToken cancellationToken)
    {
        var legalCase = await _repository
            .Query()
            .AsNoTracking()
            .Include(x => x.Contracts)
            .Include(x => x.Documents)
            .Include(x => x.InsuranceRecords)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (legalCase is null)
        {
            throw new EntityNotFoundException(nameof(LegalCase), request.Id);
        }

        var permittedTransitions = _stateMachine.GetPermittedTransitions(legalCase.Status);

        return new LegalCaseDetailDto
        {
            Id = legalCase.Id,
            CaseReference = legalCase.CaseReference,
            Title = legalCase.Title,
            Description = legalCase.Description,
            CaseType = legalCase.CaseType,
            Status = legalCase.Status,
            Priority = legalCase.Priority,
            AssignedSolicitor = legalCase.AssignedSolicitor,
            SolicitorFirm = legalCase.SolicitorFirm,
            SolicitorEmail = legalCase.SolicitorEmail,
            SolicitorPhone = legalCase.SolicitorPhone,
            Notes = legalCase.Notes,
            ResolutionSummary = legalCase.ResolutionSummary,
            ResolutionDate = legalCase.ResolutionDate,
            EscalationReason = legalCase.EscalationReason,
            HoldReason = legalCase.HoldReason,
            OpportunityId = legalCase.OpportunityId,
            PlanningApplicationId = legalCase.PlanningApplicationId,
            CreatedAt = legalCase.CreatedAt,
            CreatedBy = legalCase.CreatedBy,
            UpdatedAt = legalCase.UpdatedAt,
            UpdatedBy = legalCase.UpdatedBy,
            Contracts = legalCase.Contracts.Select(c => new ContractDto
            {
                Id = c.Id,
                ContractReference = c.ContractReference,
                Title = c.Title,
                ContractType = c.ContractType,
                Status = c.Status,
                CounterpartyName = c.CounterpartyName,
                ContractValue = c.ContractValue,
                Currency = c.Currency,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                RenewalDate = c.RenewalDate,
                CreatedAt = c.CreatedAt
            }).ToList(),
            Documents = legalCase.Documents.Select(d => new LegalDocumentDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                ConfidentialityLevel = d.ConfidentialityLevel,
                FileName = d.FileName,
                ContentType = d.ContentType,
                FileSize = d.FileSize,
                Version = d.Version,
                UploadedAt = d.UploadedAt,
                UploadedBy = d.UploadedBy,
                RetentionExpiryDate = d.RetentionExpiryDate
            }).ToList(),
            InsuranceRecords = legalCase.InsuranceRecords.Select(i => new InsuranceRecordDto
            {
                Id = i.Id,
                PolicyNumber = i.PolicyNumber,
                Insurer = i.Insurer,
                CoverageType = i.CoverageType,
                CoverAmount = i.CoverAmount,
                Premium = i.Premium,
                Currency = i.Currency,
                StartDate = i.StartDate,
                ExpiryDate = i.ExpiryDate,
                Status = i.Status
            }).ToList(),
            PermittedTransitions = permittedTransitions.ToList()
        };
    }
}
