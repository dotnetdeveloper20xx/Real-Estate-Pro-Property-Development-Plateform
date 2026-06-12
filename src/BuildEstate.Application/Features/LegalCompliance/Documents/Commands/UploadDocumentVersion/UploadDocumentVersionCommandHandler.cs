using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadDocumentVersion;

/// <summary>
/// Handles uploading a new version of an existing legal document.
/// Retrieves the original document, creates a new LegalDocument entity with Version incremented,
/// copies classification and linking fields from the original, and persists the new version.
/// The original document is retained as-is (previous versions remain).
/// </summary>
public sealed class UploadDocumentVersionCommandHandler : IRequestHandler<UploadDocumentVersionCommand, LegalDocumentDto>
{
    private readonly IRepository<LegalDocument> _documentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UploadDocumentVersionCommandHandler(
        IRepository<LegalDocument> documentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _documentRepository = documentRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<LegalDocumentDto> Handle(UploadDocumentVersionCommand request, CancellationToken cancellationToken)
    {
        var originalDocument = await _documentRepository.GetByIdAsync(request.DocumentId, cancellationToken);

        if (originalDocument is null)
        {
            throw new KeyNotFoundException($"Legal document with Id '{request.DocumentId}' was not found.");
        }

        var newVersion = new LegalDocument
        {
            // Carry forward classification and linking fields from original
            DocumentType = originalDocument.DocumentType,
            ConfidentialityLevel = originalDocument.ConfidentialityLevel,
            LegalCaseId = originalDocument.LegalCaseId,
            ContractId = originalDocument.ContractId,
            RetentionExpiryDate = originalDocument.RetentionExpiryDate,

            // Set new file metadata from command
            FileName = request.FileName,
            ContentType = request.ContentType,
            FileSize = request.FileSize,
            StoragePath = request.StoragePath,

            // Increment version
            Version = originalDocument.Version + 1,

            // Audit fields
            UploadedAt = DateTime.UtcNow,
            UploadedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _documentRepository.AddAsync(newVersion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LegalDocumentDto>(newVersion);
    }
}
