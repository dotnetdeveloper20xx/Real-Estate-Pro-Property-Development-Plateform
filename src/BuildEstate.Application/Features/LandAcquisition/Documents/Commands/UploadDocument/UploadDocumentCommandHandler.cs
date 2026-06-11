using AutoMapper;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LandAcquisition.Documents.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Commands.UploadDocument;

/// <summary>
/// Handles uploading a document for a land opportunity.
/// Verifies the opportunity exists, uploads file via IFileStorageService,
/// creates the Document entity with UploadedAt set to UTC now, and persists.
/// </summary>
public sealed class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, DocumentDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<Document> _documentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IMapper _mapper;

    public UploadDocumentCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<Document> documentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _documentRepository = documentRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
        _mapper = mapper;
    }

    public async Task<DocumentDto> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        // Verify the opportunity exists
        var opportunity = await _opportunityRepository.GetByIdAsync(request.OpportunityId, cancellationToken);
        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        // Upload file to storage
        var filePath = await _fileStorageService.UploadAsync(
            request.FileContent,
            request.FileName,
            request.ContentType,
            cancellationToken);

        // Create Document entity
        var document = new Document
        {
            OpportunityId = request.OpportunityId,
            DocType = request.DocType,
            FileName = request.FileName,
            FilePath = filePath,
            ContentType = request.ContentType,
            FileSizeBytes = request.FileSizeBytes,
            UploadedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _documentRepository.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<DocumentDto>(document);
    }
}
