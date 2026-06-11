using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Acquisitions.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.TransitionAcquisitionStatus;

/// <summary>
/// Handles acquisition status transitions.
/// Only allows Completed → Registered.
/// When transitioning to Registered, cascades the parent opportunity to Acquired via IOpportunityStateMachine.
/// </summary>
public sealed class TransitionAcquisitionStatusCommandHandler : IRequestHandler<TransitionAcquisitionStatusCommand, AcquisitionDto>
{
    private readonly IRepository<LandAcquisitionRecord> _acquisitionRepository;
    private readonly IOpportunityStateMachine _opportunityStateMachine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public TransitionAcquisitionStatusCommandHandler(
        IRepository<LandAcquisitionRecord> acquisitionRepository,
        IOpportunityStateMachine opportunityStateMachine,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _acquisitionRepository = acquisitionRepository;
        _opportunityStateMachine = opportunityStateMachine;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<AcquisitionDto> Handle(TransitionAcquisitionStatusCommand request, CancellationToken cancellationToken)
    {
        // Find the acquisition with its parent opportunity
        var acquisition = await _acquisitionRepository.Query()
            .Include(a => a.Opportunity)
            .FirstOrDefaultAsync(a => a.Id == request.AcquisitionId, cancellationToken);

        if (acquisition is null)
        {
            throw new EntityNotFoundException(nameof(LandAcquisitionRecord), request.AcquisitionId);
        }

        // Only allow Completed → Registered
        if (acquisition.Status != AcquisitionStatus.Completed || request.TargetStatus != AcquisitionStatus.Registered)
        {
            throw new BusinessRuleViolationException(
                "InvalidAcquisitionTransition",
                $"Acquisition status can only transition from Completed to Registered. Current status: {acquisition.Status}, Target: {request.TargetStatus}.");
        }

        // Cascade: validate opportunity can transition to Acquired, then apply it
        _opportunityStateMachine.ValidateTransition(acquisition.Opportunity.Status, OpportunityStatus.Acquired);
        acquisition.Opportunity.Status = OpportunityStatus.Acquired;
        acquisition.Opportunity.UpdatedAt = DateTime.UtcNow;
        acquisition.Opportunity.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        // Apply the acquisition status transition
        acquisition.Status = AcquisitionStatus.Registered;
        acquisition.UpdatedAt = DateTime.UtcNow;
        acquisition.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _acquisitionRepository.Update(acquisition);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<AcquisitionDto>(acquisition);
    }
}
