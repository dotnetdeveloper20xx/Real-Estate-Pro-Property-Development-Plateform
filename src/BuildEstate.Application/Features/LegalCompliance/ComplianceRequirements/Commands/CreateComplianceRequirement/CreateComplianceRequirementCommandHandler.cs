using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.CreateComplianceRequirement;

/// <summary>
/// Handles creation of a new ComplianceRequirement entity.
/// Enforces uniqueness of Name within Category for active requirements,
/// sets Status to Active, assigns audit fields, and persists.
/// </summary>
public sealed class CreateComplianceRequirementCommandHandler : IRequestHandler<CreateComplianceRequirementCommand, ComplianceRequirementDto>
{
    private readonly IRepository<ComplianceRequirement> _complianceRequirementRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateComplianceRequirementCommandHandler(
        IRepository<ComplianceRequirement> complianceRequirementRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _complianceRequirementRepository = complianceRequirementRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<ComplianceRequirementDto> Handle(CreateComplianceRequirementCommand request, CancellationToken cancellationToken)
    {
        // Check uniqueness of Name within Category for active requirements
        var duplicateExists = await _complianceRequirementRepository.Query()
            .AnyAsync(r =>
                r.Name == request.Name &&
                r.Category == request.Category &&
                r.Status == ComplianceRequirementStatus.Active &&
                !r.IsDeleted,
                cancellationToken);

        if (duplicateExists)
        {
            throw new DuplicateEntityException(
                nameof(ComplianceRequirement),
                "Name within Category",
                $"{request.Name} ({request.Category})");
        }

        var complianceRequirement = new ComplianceRequirement
        {
            Name = request.Name,
            Category = request.Category,
            Description = request.Description,
            SourceRegulation = request.SourceRegulation,
            Frequency = request.Frequency,
            ResponsibleRole = request.ResponsibleRole,
            Status = ComplianceRequirementStatus.Active,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _complianceRequirementRepository.AddAsync(complianceRequirement, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ComplianceRequirementDto>(complianceRequirement);
    }
}
