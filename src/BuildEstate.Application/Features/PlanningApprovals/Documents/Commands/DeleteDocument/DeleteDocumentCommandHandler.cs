using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.DeleteDocument;

/// <summary>
/// Handles soft-deletion of a planning document.
/// Loads the document by ID, deletes the file from storage,
/// sets IsDeleted = true, DeletedAt = UTC now, DeletedBy = current user,
/// and persists. The audit trail is recorded automatically by the AuditInterceptor.
/// </summary>
public sealed class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand, Unit>
{
    private readonly IRepository<PlanningDocument> _documentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public DeleteDocumentCommandHandler(
        IRepository<PlanningDocument> documentRepository,
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
        // Load the document by ID
        var document = await _documentRepository.GetByIdAsync(request.DocumentId, cancellationToken);
        if (document is null)
        {
            throw new EntityNotFoundException(nameof(PlanningDocument), request.DocumentId);
        }

        // Delete file from storage
        await _fileStorageService.DeleteAsync(document.StoragePath, cancellationToken);

        // Soft-delete the document entity
        document.IsDeleted = true;
        document.DeletedAt = DateTime.UtcNow;
        document.DeletedBy = _currentUserService.UserId ?? string.Empty;

        _documentRepository.Update(document);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
