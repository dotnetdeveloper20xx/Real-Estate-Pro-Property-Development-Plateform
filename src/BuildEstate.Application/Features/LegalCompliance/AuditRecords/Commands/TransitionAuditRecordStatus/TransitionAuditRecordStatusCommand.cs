using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.TransitionAuditRecordStatus;

/// <summary>
/// Command to transition an audit record to a new status.
/// Enforces state machine rules and status-specific field requirements:
/// - FindingsRecorded: Findings (≥20 chars) + RiskRating
/// - ActionsRequired: Recommendations (≥20 chars) + ActionDueDate (future UTC)
/// </summary>
public sealed record TransitionAuditRecordStatusCommand : IRequest<AuditRecordDto>
{
    public Guid Id { get; init; }
    public AuditRecordStatus NewStatus { get; init; }
    public string? Findings { get; init; }
    public RiskRating? RiskRating { get; init; }
    public string? Recommendations { get; init; }
    public DateTime? ActionDueDate { get; init; }
}
