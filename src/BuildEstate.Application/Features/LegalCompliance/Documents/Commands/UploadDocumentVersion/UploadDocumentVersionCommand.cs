using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadDocumentVersion;

/// <summary>
/// Command to upload a new version of an existing legal document.
/// Creates a new LegalDocument entity with an incremented version number,
/// retaining the original document as a previous version.
/// </summary>
public sealed record UploadDocumentVersionCommand : IRequest<LegalDocumentDto>
{
    /// <summary>
    /// The identifier of the existing document to version.
    /// </summary>
    public Guid DocumentId { get; init; }

    /// <summary>
    /// The file name of the new document version.
    /// </summary>
    public string FileName { get; init; } = string.Empty;

    /// <summary>
    /// The MIME content type of the uploaded file.
    /// </summary>
    public string ContentType { get; init; } = string.Empty;

    /// <summary>
    /// The size of the uploaded file in bytes.
    /// </summary>
    public long FileSize { get; init; }

    /// <summary>
    /// The storage path where the file has been persisted.
    /// </summary>
    public string StoragePath { get; init; } = string.Empty;
}
