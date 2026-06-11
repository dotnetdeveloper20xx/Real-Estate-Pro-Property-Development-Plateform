using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Acquisitions.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.CreateAcquisition;

/// <summary>
/// Handles creation of a land acquisition record.
/// Verifies the opportunity exists, enforces one active acquisition per opportunity,
/// and sets Status to Completed.
/// </summary>
public sealed class CreateAcquisitionCommandHandler : IRequestHandler<CreateAcquisitionCommand, AcquisitionDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<LandAcquisitionRecord> _acquisitionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateAcquisitionCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<LandAcquisitionRecord> acquisitionRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _acquisitionRepository = acquisitionRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<AcquisitionDto> Handle(CreateAcquisitionCommand request, CancellationToken cancellationToken)
    {
        // Verify the opportunity exists
        var opportunity = await _opportunityRepository.GetByIdAsync(request.OpportunityId, cancellationToken);
        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        // Enforce one active acquisition per opportunity
        var existingAcquisition = await _acquisitionRepository.Query()
            .AnyAsync(a => a.OpportunityId == request.OpportunityId, cancellationToken);

        if (existingAcquisition)
        {
            throw new BusinessRuleViolationException(
                "OneAcquisitionPerOpportunity",
                "Only one active acquisition record is allowed per opportunity.");
        }

        // Create the acquisition record with Status=Completed
        var acquisition = new LandAcquisitionRecord
        {
            OpportunityId = request.OpportunityId,
            PurchasePrice = request.PurchasePrice,
            CompletionDate = request.CompletionDate,
            RegistryRef = request.RegistryRef,
            Status = AcquisitionStatus.Completed,
            CreatedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _acquisitionRepository.AddAsync(acquisition, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<AcquisitionDto>(acquisition);
    }
}
