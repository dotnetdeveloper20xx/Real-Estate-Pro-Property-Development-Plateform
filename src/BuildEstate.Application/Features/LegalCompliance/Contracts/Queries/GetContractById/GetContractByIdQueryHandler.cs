using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Queries.GetContractById;

/// <summary>
/// Handles retrieval of a single contract with Documents and LegalCase
/// eager-loaded for the detail view. Includes permitted status transitions
/// from the contract state machine.
/// Throws EntityNotFoundException if the contract does not exist.
/// </summary>
public sealed class GetContractByIdQueryHandler
    : IRequestHandler<GetContractByIdQuery, ContractDetailDto>
{
    private readonly IRepository<Contract> _repository;
    private readonly ILegalContractStateMachine _stateMachine;

    public GetContractByIdQueryHandler(
        IRepository<Contract> repository,
        ILegalContractStateMachine stateMachine)
    {
        _repository = repository;
        _stateMachine = stateMachine;
    }

    public async Task<ContractDetailDto> Handle(
        GetContractByIdQuery request,
        CancellationToken cancellationToken)
    {
        var contract = await _repository
            .Query()
            .AsNoTracking()
            .Include(c => c.Documents)
            .Include(c => c.LegalCase)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (contract is null)
        {
            throw new EntityNotFoundException(nameof(Contract), request.Id);
        }

        var permittedTransitions = _stateMachine.GetPermittedTransitions(contract.Status);

        return new ContractDetailDto
        {
            Id = contract.Id,
            ContractReference = contract.ContractReference,
            Title = contract.Title,
            ContractType = contract.ContractType.ToString(),
            Status = contract.Status.ToString(),
            CounterpartyName = contract.CounterpartyName,
            ContractValue = contract.ContractValue,
            Currency = contract.Currency,
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            RenewalDate = contract.RenewalDate,
            TerminationClause = contract.TerminationClause,
            SpecialConditions = contract.SpecialConditions,
            PaymentTerms = contract.PaymentTerms,
            ExecutionDate = contract.ExecutionDate,
            SignatoryNames = contract.SignatoryNames,
            TerminationReason = contract.TerminationReason,
            TerminationDate = contract.TerminationDate,
            ApproverUserId = contract.ApproverUserId,
            ApprovalTimestamp = contract.ApprovalTimestamp,
            ApprovalNotes = contract.ApprovalNotes,
            LegalCaseId = contract.LegalCaseId,
            CreatedAt = contract.CreatedAt,
            CreatedBy = contract.CreatedBy,
            UpdatedAt = contract.UpdatedAt,
            LegalCaseReference = contract.LegalCase?.CaseReference,
            Documents = contract.Documents.Select(d => new ContractDocumentDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType.ToString(),
                ConfidentialityLevel = d.ConfidentialityLevel.ToString(),
                FileName = d.FileName,
                ContentType = d.ContentType,
                FileSize = d.FileSize,
                Version = d.Version,
                UploadedAt = d.UploadedAt,
                UploadedBy = d.UploadedBy
            }).ToList(),
            PermittedTransitions = permittedTransitions.ToList()
        };
    }
}
