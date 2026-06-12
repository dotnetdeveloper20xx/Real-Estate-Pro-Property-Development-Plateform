using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.CreateContract;

/// <summary>
/// Handles creation of a new Contract entity.
/// Validates that the referenced LegalCase exists and has an eligible status (Open, InProgress, UnderReview).
/// Generates a unique contract reference, sets Status to Draft, and persists the entity.
/// </summary>
public sealed class CreateContractCommandHandler : IRequestHandler<CreateContractCommand, ContractDto>
{
    private readonly IRepository<Contract> _contractRepository;
    private readonly IRepository<LegalCase> _legalCaseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILegalReferenceNumberGenerator _referenceNumberGenerator;
    private readonly IMapper _mapper;

    private static readonly LegalCaseStatus[] EligibleCaseStatuses =
    {
        LegalCaseStatus.Open,
        LegalCaseStatus.InProgress,
        LegalCaseStatus.UnderReview
    };

    public CreateContractCommandHandler(
        IRepository<Contract> contractRepository,
        IRepository<LegalCase> legalCaseRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        ILegalReferenceNumberGenerator referenceNumberGenerator,
        IMapper mapper)
    {
        _contractRepository = contractRepository;
        _legalCaseRepository = legalCaseRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _referenceNumberGenerator = referenceNumberGenerator;
        _mapper = mapper;
    }

    public async Task<ContractDto> Handle(CreateContractCommand request, CancellationToken cancellationToken)
    {
        // Validate that the referenced legal case exists
        var legalCase = await _legalCaseRepository.Query()
            .FirstOrDefaultAsync(c => c.Id == request.LegalCaseId && !c.IsDeleted, cancellationToken);

        if (legalCase is null)
        {
            throw new EntityNotFoundException(nameof(LegalCase), request.LegalCaseId);
        }

        // Validate that the legal case has an eligible status for contract creation
        if (!EligibleCaseStatuses.Contains(legalCase.Status))
        {
            throw new BusinessRuleViolationException(
                "LegalCaseStatusEligibility",
                $"Contracts can only be created for legal cases with status Open, InProgress, or UnderReview. " +
                $"Current status is '{legalCase.Status}'.");
        }

        // Generate unique contract reference
        var contractReference = await _referenceNumberGenerator.GenerateContractReferenceAsync(cancellationToken);

        var contract = new Contract
        {
            ContractReference = contractReference,
            Title = request.Title,
            ContractType = request.ContractType,
            Status = LegalContractStatus.Draft,
            CounterpartyName = request.CounterpartyName,
            ContractValue = request.ContractValue,
            Currency = request.Currency.ToUpperInvariant(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            LegalCaseId = request.LegalCaseId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _contractRepository.AddAsync(contract, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ContractDto>(contract);
    }
}
