using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.DeleteLegalDocument;

/// <summary>
/// Command to soft-delete a legal document.
/// Restricted to Legal_Compliance_Officer role (enforced in handler).
/// Records deletion in audit trail via the AuditInterceptor on SaveChanges.
/// </summary>
public sealed record DeleteLegalDocumentCommand : IRequest<Unit>
{
    public Guid Id { get; init; }
}
