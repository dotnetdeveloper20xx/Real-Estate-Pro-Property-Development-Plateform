using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Commands.CreateComplianceCheck;

/// <summary>
/// Handles creation of a new ComplianceCheck entity.
/// Validates the referenced ComplianceRequirement is active, assigns reviewer identity from current user,
/// calculates and updates NextDueDate on the requirement, raises ComplianceCheckRecordedEvent, and persists.
/// </summary>
public sealed class CreateComplianceCheckCommandHandler : IRequestHandler<CreateComplianceCheckCommand, ComplianceCheckDto>
{
    private readonly IRepository<ComplianceCheck> _complianceCheckRepository;
    private readonly IRepository<ComplianceRequirement> _complianceRequirementRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IPublisher _publisher;

    public CreateComplianceCheckCommandHandler(
        IRepository<ComplianceCheck> complianceCheckRepository,
        IRepository<ComplianceRequirement> complianceRequirementRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IPublisher publisher)
    {
        _complianceCheckRepository = complianceCheckRepository;
        _complianceRequirementRepository = complianceRequirementRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _publisher = publisher;
    }

    public async Task<ComplianceCheckDto> Handle(CreateComplianceCheckCommand request, CancellationToken cancellationToken)
    {
        var requirement = await _complianceRequirementRepository.GetByIdAsync(request.ComplianceRequirementId, cancellationToken);

        if (requirement is null)
        {
            throw new EntityNotFoundException(nameof(ComplianceRequirement), request.ComplianceRequirementId);
        }

        if (requirement.Status != ComplianceRequirementStatus.Active)
        {
            throw new BusinessRuleViolationException(
                "ComplianceRequirementMustBeActive",
                $"ComplianceRequirement '{request.ComplianceRequirementId}' must have Active status to record a check. Current status: {requirement.Status}.");
        }

        var complianceCheck = new ComplianceCheck
        {
            ComplianceRequirementId = request.ComplianceRequirementId,
            CheckDate = request.CheckDate,
            Outcome = request.Outcome,
            Findings = request.Findings,
            EvidenceReference = request.EvidenceReference,
            RemediationPlan = request.RemediationPlan,
            RemediationDueDate = request.RemediationDueDate,
            ReviewerUserId = _currentUserService.UserId ?? string.Empty,
            ReviewerName = _currentUserService.UserName ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        // Calculate NextDueDate based on Frequency + CheckDate and update the requirement
        var nextDueDate = CalculateNextDueDate(requirement.Frequency, request.CheckDate);
        requirement.NextDueDate = nextDueDate;
        requirement.UpdatedAt = DateTime.UtcNow;
        requirement.UpdatedBy = _currentUserService.UserId;
        _complianceRequirementRepository.Update(requirement);

        await _complianceCheckRepository.AddAsync(complianceCheck, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Publish ComplianceCheckRecordedEvent via MediatR
        await _publisher.Publish(new ComplianceCheckRecordedEvent
        {
            ComplianceCheckId = complianceCheck.Id,
            ComplianceRequirementId = request.ComplianceRequirementId,
            Outcome = request.Outcome,
            CheckDate = request.CheckDate,
            ReviewerUserId = complianceCheck.ReviewerUserId,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        return _mapper.Map<ComplianceCheckDto>(complianceCheck);
    }

    /// <summary>
    /// Calculates the next due date based on the compliance frequency and the check date.
    /// Returns null for OneOff and Ongoing frequencies.
    /// </summary>
    private static DateTime? CalculateNextDueDate(ComplianceFrequency frequency, DateTime checkDate)
    {
        return frequency switch
        {
            ComplianceFrequency.Daily => checkDate.AddDays(1),
            ComplianceFrequency.Weekly => checkDate.AddDays(7),
            ComplianceFrequency.Monthly => checkDate.AddMonths(1),
            ComplianceFrequency.Quarterly => checkDate.AddMonths(3),
            ComplianceFrequency.Annually => checkDate.AddYears(1),
            ComplianceFrequency.OneOff => null,
            ComplianceFrequency.Ongoing => null,
            _ => null
        };
    }
}
