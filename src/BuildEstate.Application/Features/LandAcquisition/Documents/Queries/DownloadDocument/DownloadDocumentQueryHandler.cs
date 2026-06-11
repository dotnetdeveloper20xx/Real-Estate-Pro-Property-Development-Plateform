using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Queries.DownloadDocument;

/// <summary>
/// Handles downloading a document. Finds the document metadata,
/// retrieves the file stream via IFileStorageService, and returns
/// the stream with content type and file name.
/// </summary>
public sealed class DownloadDocumentQueryHandler
    : IRequestHandler<DownloadDocumentQuery, DownloadDocumentResult>
{
    private readonly IRepository<Document> _documentRepository;
    private readonly IFileStorageService _fileStorageService;

    public DownloadDocumentQueryHandler(
        IRepository<Document> documentRepository,
        IFileStorageService fileStorageService)
    {
        _documentRepository = documentRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<DownloadDocumentResult> Handle(
        DownloadDocumentQuery request,
        CancellationToken cancellationToken)
    {
        // Find document metadata
        var document = await _documentRepository.GetByIdAsync(request.DocumentId, cancellationToken);
        if (document is null)
        {
            throw new EntityNotFoundException(nameof(Document), request.DocumentId);
        }

        // Retrieve file stream from storage
        var fileStream = await _fileStorageService.DownloadAsync(document.FilePath, cancellationToken);

        return new DownloadDocumentResult(fileStream, document.ContentType, document.FileName);
    }
}
