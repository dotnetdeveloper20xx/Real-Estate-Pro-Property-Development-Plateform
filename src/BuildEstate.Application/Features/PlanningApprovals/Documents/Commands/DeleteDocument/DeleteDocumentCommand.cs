using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.DeleteDocument;

/// <summary>
/// Command to soft-delete a planning document.
/// Restricted to Admin_Support or Planning_Manager role (enforced at controller level).
/// Records deletion in audit trail via the AuditInterceptor on SaveChanges.
/// </summary>
public sealed record DeleteDocumentCommand : IRequest<Unit>
{
    public Guid DocumentId { get; init; }
}
