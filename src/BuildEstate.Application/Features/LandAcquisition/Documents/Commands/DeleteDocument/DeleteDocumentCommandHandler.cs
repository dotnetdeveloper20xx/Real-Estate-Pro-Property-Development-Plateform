using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Commands.DeleteDocument;

/// <summary>
/// Handles deletion of a document. Finds the document, deletes the file
/// from storage via IFileStorageService, soft-deletes the entity
/// (IsDeleted=true, DeletedAt=UTC now, DeletedBy=current user), and persists.
/// </summary>
public sealed class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand, Unit>
{
    private readonly IRepository<Document> _documentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public DeleteDocumentCommandHandler(
        IRepository<Document> documentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _documentRepository = documentRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<Unit> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        // Find the document
        var document = await _documentRepository.GetByIdAsync(request.DocumentId, cancellationToken);
        if (document is null)
        {
            throw new EntityNotFoundException(nameof(Document), request.DocumentId);
        }

        // Delete file from storage
        await _fileStorageService.DeleteAsync(document.FilePath, cancellationToken);

        // Soft-delete the document entity
        document.IsDeleted = true;
        document.DeletedAt = DateTime.UtcNow;
        document.DeletedBy = _currentUserService.UserId ?? string.Empty;

        _documentRepository.Update(document);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
