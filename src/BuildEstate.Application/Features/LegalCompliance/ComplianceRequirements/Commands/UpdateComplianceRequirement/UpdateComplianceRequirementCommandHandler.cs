using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.UpdateComplianceRequirement;

/// <summary>
/// Handles updating an existing ComplianceRequirement entity.
/// Applies only non-null fields (partial update pattern), sets audit fields, and persists.
/// Throws EntityNotFoundException if the compliance requirement does not exist.
/// </summary>
public sealed class UpdateComplianceRequirementCommandHandler : IRequestHandler<UpdateComplianceRequirementCommand, ComplianceRequirementDto>
{
    private readonly IRepository<ComplianceRequirement> _complianceRequirementRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateComplianceRequirementCommandHandler(
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

    public async Task<ComplianceRequirementDto> Handle(UpdateComplianceRequirementCommand request, CancellationToken cancellationToken)
    {
        var complianceRequirement = await _complianceRequirementRepository.GetByIdAsync(request.Id, cancellationToken);
        if (complianceRequirement is null)
        {
            throw new EntityNotFoundException(nameof(ComplianceRequirement), request.Id);
        }

        // Apply only non-null fields (partial update)
        if (request.Name is not null)
            complianceRequirement.Name = request.Name;

        if (request.Description is not null)
            complianceRequirement.Description = request.Description;

        if (request.SourceRegulation is not null)
            complianceRequirement.SourceRegulation = request.SourceRegulation;

        if (request.Frequency.HasValue)
            complianceRequirement.Frequency = request.Frequency.Value;

        if (request.ResponsibleRole is not null)
            complianceRequirement.ResponsibleRole = request.ResponsibleRole;

        complianceRequirement.UpdatedAt = DateTime.UtcNow;
        complianceRequirement.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _complianceRequirementRepository.Update(complianceRequirement);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ComplianceRequirementDto>(complianceRequirement);
    }
}
