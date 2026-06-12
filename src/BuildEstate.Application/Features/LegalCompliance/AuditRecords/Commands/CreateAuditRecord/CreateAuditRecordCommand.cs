using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.CreateAuditRecord;

/// <summary>
/// Command to create a new audit record.
/// Captures audit type, scope, auditor details, audit date, and optional integration links.
/// </summary>
public sealed record CreateAuditRecordCommand : IRequest<AuditRecordDto>
{
    public AuditType AuditType { get; init; }
    public string Scope { get; init; } = string.Empty;
    public string AuditorName { get; init; } = string.Empty;
    public DateTime AuditDate { get; init; }
    public Guid? LegalCaseId { get; init; }
    public Guid? ComplianceRequirementId { get; init; }
}
