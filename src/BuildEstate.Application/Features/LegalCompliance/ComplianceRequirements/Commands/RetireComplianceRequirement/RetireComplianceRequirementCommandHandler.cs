using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.RetireComplianceRequirement;

/// <summary>
/// Handles retiring or superseding an existing ComplianceRequirement.
/// Validates that the current status is Active (cannot retire an already retired/superseded requirement),
/// sets the new status, retirement reason, audit fields, and persists.
/// </summary>
public sealed class RetireComplianceRequirementCommandHandler : IRequestHandler<RetireComplianceRequirementCommand, ComplianceRequirementDto>
{
    private readonly IRepository<ComplianceRequirement> _complianceRequirementRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public RetireComplianceRequirementCommandHandler(
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

    public async Task<ComplianceRequirementDto> Handle(RetireComplianceRequirementCommand request, CancellationToken cancellationToken)
    {
        var complianceRequirement = await _complianceRequirementRepository.GetByIdAsync(request.Id, cancellationToken);
        if (complianceRequirement is null)
        {
            throw new EntityNotFoundException(nameof(ComplianceRequirement), request.Id);
        }

        if (complianceRequirement.Status != ComplianceRequirementStatus.Active)
        {
            throw new BusinessRuleViolationException(
                "RetireComplianceRequirement",
                $"Cannot retire a compliance requirement with status '{complianceRequirement.Status}'. Only Active requirements can be retired or superseded.");
        }

        complianceRequirement.Status = request.NewStatus;
        complianceRequirement.RetirementReason = request.RetirementReason;
        complianceRequirement.UpdatedAt = DateTime.UtcNow;
        complianceRequirement.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _complianceRequirementRepository.Update(complianceRequirement);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ComplianceRequirementDto>(complianceRequirement);
    }
}
