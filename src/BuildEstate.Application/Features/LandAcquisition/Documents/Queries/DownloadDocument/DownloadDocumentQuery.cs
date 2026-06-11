using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Queries.DownloadDocument;

/// <summary>
/// Query to download a document by its ID.
/// Returns the file stream along with content type and file name for the response.
/// </summary>
public sealed record DownloadDocumentQuery : IRequest<DownloadDocumentResult>
{
    public Guid DocumentId { get; init; }
}

/// <summary>
/// Result containing the file stream, content type, and original file name.
/// </summary>
public sealed record DownloadDocumentResult(
    Stream FileStream,
    string ContentType,
    string FileName);
