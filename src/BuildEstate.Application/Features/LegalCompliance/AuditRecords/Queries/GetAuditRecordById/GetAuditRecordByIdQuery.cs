using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Queries.GetAuditRecordById;

/// <summary>
/// Query to retrieve a single audit record by its unique identifier,
/// including permitted status transitions from the state machine,
/// days until action due, and linked entity names for display.
/// </summary>
public sealed record GetAuditRecordByIdQuery : IRequest<AuditRecordDetailDto>
{
    public Guid Id { get; init; }
}
