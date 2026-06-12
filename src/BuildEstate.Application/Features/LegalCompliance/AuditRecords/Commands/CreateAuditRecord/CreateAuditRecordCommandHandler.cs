using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.CreateAuditRecord;

/// <summary>
/// Handles creation of a new AuditRecord entity.
/// Sets Status to Planned, assigns audit fields (CreatedAt, CreatedBy), persists,
/// and returns the mapped AuditRecordDto.
/// </summary>
public sealed class CreateAuditRecordCommandHandler : IRequestHandler<CreateAuditRecordCommand, AuditRecordDto>
{
    private readonly IRepository<AuditRecord> _auditRecordRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateAuditRecordCommandHandler(
        IRepository<AuditRecord> auditRecordRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _auditRecordRepository = auditRecordRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<AuditRecordDto> Handle(CreateAuditRecordCommand request, CancellationToken cancellationToken)
    {
        var auditRecord = new AuditRecord
        {
            AuditType = request.AuditType,
            Scope = request.Scope,
            AuditorName = request.AuditorName,
            AuditDate = request.AuditDate,
            Status = AuditRecordStatus.Planned,
            LegalCaseId = request.LegalCaseId,
            ComplianceRequirementId = request.ComplianceRequirementId,
            IsOverdue = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _auditRecordRepository.AddAsync(auditRecord, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<AuditRecordDto>(auditRecord);
    }
}
