using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadLegalDocument;

/// <summary>
/// Handles upload of a new LegalDocument entity.
/// Sets Version=1, UploadedAt to current UTC time, UploadedBy to the authenticated user,
/// and persists the entity.
/// </summary>
public sealed class UploadLegalDocumentCommandHandler : IRequestHandler<UploadLegalDocumentCommand, LegalDocumentDto>
{
    private readonly IRepository<LegalDocument> _documentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UploadLegalDocumentCommandHandler(
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

    public async Task<LegalDocumentDto> Handle(UploadLegalDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = new LegalDocument
        {
            LegalCaseId = request.LegalCaseId,
            ContractId = request.ContractId,
            DocumentType = request.DocumentType,
            ConfidentialityLevel = request.ConfidentialityLevel,
            FileName = request.FileName,
            ContentType = request.ContentType,
            FileSize = request.FileSize,
            StoragePath = request.StoragePath,
            RetentionExpiryDate = request.RetentionExpiryDate,
            Version = 1,
            UploadedAt = DateTime.UtcNow,
            UploadedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _documentRepository.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LegalDocumentDto>(document);
    }
}
