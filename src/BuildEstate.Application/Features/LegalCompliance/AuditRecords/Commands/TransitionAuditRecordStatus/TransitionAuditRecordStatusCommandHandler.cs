using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.TransitionAuditRecordStatus;

/// <summary>
/// Handles transitioning an audit record to a new status.
/// Enforces state machine rules and sets status-specific fields before persisting.
/// </summary>
public sealed class TransitionAuditRecordStatusCommandHandler
    : IRequestHandler<TransitionAuditRecordStatusCommand, AuditRecordDto>
{
    private readonly IRepository<AuditRecord> _auditRecordRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IAuditRecordStateMachine _stateMachine;

    public TransitionAuditRecordStatusCommandHandler(
        IRepository<AuditRecord> auditRecordRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IAuditRecordStateMachine stateMachine)
    {
        _auditRecordRepository = auditRecordRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _stateMachine = stateMachine;
    }

    public async Task<AuditRecordDto> Handle(
        TransitionAuditRecordStatusCommand request,
        CancellationToken cancellationToken)
    {
        var auditRecord = await _auditRecordRepository.GetByIdAsync(request.Id, cancellationToken);

        if (auditRecord is null)
        {
            throw new EntityNotFoundException(nameof(AuditRecord), request.Id);
        }

        // Validate transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(auditRecord.Status, request.NewStatus);

        // Apply the new status
        auditRecord.Status = request.NewStatus;

        // Set status-specific fields
        switch (request.NewStatus)
        {
            case AuditRecordStatus.FindingsRecorded:
                auditRecord.Findings = request.Findings;
                auditRecord.RiskRating = request.RiskRating;
                break;

            case AuditRecordStatus.ActionsRequired:
                auditRecord.Recommendations = request.Recommendations;
                auditRecord.ActionDueDate = request.ActionDueDate;
                break;
        }

        // Set audit fields
        auditRecord.UpdatedAt = DateTime.UtcNow;
        auditRecord.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _auditRecordRepository.Update(auditRecord);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<AuditRecordDto>(auditRecord);
    }
}
