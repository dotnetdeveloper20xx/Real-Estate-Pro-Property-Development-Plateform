using AutoMapper;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.UploadDocument;

/// <summary>
/// Handles uploading a document for a planning application.
/// Verifies the application exists, uploads file via IFileStorageService,
/// creates the PlanningDocument entity with UploadedAt set to UTC now, and persists.
/// </summary>
public sealed class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, DocumentDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<PlanningDocument> _documentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IMapper _mapper;

    public UploadDocumentCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<PlanningDocument> documentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService,
        IMapper mapper)
    {
        _applicationRepository = applicationRepository;
        _documentRepository = documentRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
        _mapper = mapper;
    }

    public async Task<DocumentDto> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        // Verify the planning application exists
        var application = await _applicationRepository.GetByIdAsync(request.ApplicationId, cancellationToken);
        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        // Upload file to storage
        var storagePath = await _fileStorageService.UploadAsync(
            request.FileContent,
            request.FileName,
            request.ContentType,
            cancellationToken);

        // Create PlanningDocument entity
        var document = new PlanningDocument
        {
            ApplicationId = request.ApplicationId,
            DocumentType = request.DocumentType,
            FileName = request.FileName,
            ContentType = request.ContentType,
            FileSizeBytes = request.FileSizeBytes,
            StoragePath = storagePath,
            UploadedAt = DateTime.UtcNow,
            UploadedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _documentRepository.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<DocumentDto>(document);
    }
}
