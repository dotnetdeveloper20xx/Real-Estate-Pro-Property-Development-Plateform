using BuildEstate.Application.Features.LandAcquisition.Documents.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Commands.UploadDocument;

/// <summary>
/// Command to upload a document for a land opportunity.
/// Sets UploadedAt to UTC now upon successful storage.
/// </summary>
public sealed record UploadDocumentCommand : IRequest<DocumentDto>
{
    public Guid OpportunityId { get; init; }
    public DocumentType DocType { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
    public Stream FileContent { get; init; } = Stream.Null;
}
