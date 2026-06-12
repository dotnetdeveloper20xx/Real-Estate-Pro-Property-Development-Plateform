using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Queries.DownloadDocument;

/// <summary>
/// Handles downloading a planning document. Finds the document metadata by ID,
/// retrieves the file stream via IFileStorageService using the StoragePath,
/// and returns the stream with content type and file name.
/// </summary>
public sealed class DownloadDocumentQueryHandler
    : IRequestHandler<DownloadDocumentQuery, DownloadDocumentResult>
{
    private readonly IRepository<PlanningDocument> _documentRepository;
    private readonly IFileStorageService _fileStorageService;

    public DownloadDocumentQueryHandler(
        IRepository<PlanningDocument> documentRepository,
        IFileStorageService fileStorageService)
    {
        _documentRepository = documentRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<DownloadDocumentResult> Handle(
        DownloadDocumentQuery request,
        CancellationToken cancellationToken)
    {
        // Load document metadata by ID
        var document = await _documentRepository.GetByIdAsync(request.DocumentId, cancellationToken);
        if (document is null)
        {
            throw new EntityNotFoundException(nameof(PlanningDocument), request.DocumentId);
        }

        // Retrieve file content from storage using StoragePath
        var fileStream = await _fileStorageService.DownloadAsync(document.StoragePath, cancellationToken);

        return new DownloadDocumentResult(fileStream, document.ContentType, document.FileName);
    }
}
