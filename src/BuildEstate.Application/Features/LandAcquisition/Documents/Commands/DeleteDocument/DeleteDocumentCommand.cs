using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Commands.DeleteDocument;

/// <summary>
/// Command to delete (soft-delete) a document.
/// Restricted to AdminSupport role. Records audit trail on deletion.
/// </summary>
public sealed record DeleteDocumentCommand : IRequest<Unit>
{
    public Guid DocumentId { get; init; }
}
