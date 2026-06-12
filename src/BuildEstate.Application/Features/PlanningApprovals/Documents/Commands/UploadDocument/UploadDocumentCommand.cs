using BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.UploadDocument;

/// <summary>
/// Command to upload a document for a planning application.
/// Stores the file via IFileStorageService and saves metadata with UploadedAt = UTC now.
/// </summary>
public sealed record UploadDocumentCommand : IRequest<DocumentDto>
{
    public Guid ApplicationId { get; init; }
    public PlanningDocumentType DocumentType { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
    public Stream FileContent { get; init; } = Stream.Null;
}
