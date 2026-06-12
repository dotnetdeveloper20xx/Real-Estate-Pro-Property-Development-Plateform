using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Services;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.CreateLegalCase;

/// <summary>
/// Handles creation of a new LegalCase entity.
/// Generates a unique CaseReference, sets Status to Open, assigns audit fields, and persists.
/// </summary>
public sealed class CreateLegalCaseCommandHandler : IRequestHandler<CreateLegalCaseCommand, LegalCaseDto>
{
    private readonly IRepository<LegalCase> _legalCaseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILegalReferenceNumberGenerator _referenceNumberGenerator;
    private readonly IMapper _mapper;

    public CreateLegalCaseCommandHandler(
        IRepository<LegalCase> legalCaseRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        ILegalReferenceNumberGenerator referenceNumberGenerator,
        IMapper mapper)
    {
        _legalCaseRepository = legalCaseRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _referenceNumberGenerator = referenceNumberGenerator;
        _mapper = mapper;
    }

    public async Task<LegalCaseDto> Handle(CreateLegalCaseCommand request, CancellationToken cancellationToken)
    {
        var caseReference = await _referenceNumberGenerator.GenerateCaseReferenceAsync(cancellationToken);

        var legalCase = new LegalCase
        {
            CaseReference = caseReference,
            Title = request.Title,
            Description = request.Description,
            CaseType = request.CaseType,
            Status = LegalCaseStatus.Open,
            Priority = request.Priority,
            OpportunityId = request.OpportunityId,
            PlanningApplicationId = request.PlanningApplicationId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _legalCaseRepository.AddAsync(legalCase, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LegalCaseDto>(legalCase);
    }
}
