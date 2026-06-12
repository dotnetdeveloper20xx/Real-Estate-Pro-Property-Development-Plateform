using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Queries.GetDocumentsForCase;

/// <summary>
/// Handles retrieval of a paginated, filtered list of documents for a legal case.
/// Uses AsNoTracking for optimised read-only queries and projects directly to DTOs.
/// Excludes Restricted documents for users without the Legal_Compliance_Officer role.
/// Results are ordered by UploadedAt descending (most recent first).
/// </summary>
public sealed class GetDocumentsForCaseQueryHandler
    : IRequestHandler<GetDocumentsForCaseQuery, PagedResult<LegalDocumentListItemDto>>
{
    private readonly IRepository<LegalDocument> _repository;
    private readonly ICurrentUserService _currentUserService;

    private const string LegalComplianceOfficerRole = "Legal_Compliance_Officer";

    public GetDocumentsForCaseQueryHandler(
        IRepository<LegalDocument> repository,
        ICurrentUserService currentUserService)
    {
        _repository = repository;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<LegalDocumentListItemDto>> Handle(
        GetDocumentsForCaseQuery request,
        CancellationToken cancellationToken)
    {
        var query = _repository.Query()
            .AsNoTracking()
            .Where(d => d.LegalCaseId == request.LegalCaseId);

        // Confidentiality check: exclude Restricted documents for non-Legal_Compliance_Officer users
        if (!_currentUserService.IsInRole(LegalComplianceOfficerRole))
        {
            query = query.Where(d => d.ConfidentialityLevel != ConfidentialityLevel.Restricted);
        }

        // Apply filters
        if (request.DocumentType.HasValue)
        {
            query = query.Where(d => d.DocumentType == request.DocumentType.Value);
        }

        if (request.ConfidentialityLevel.HasValue)
        {
            query = query.Where(d => d.ConfidentialityLevel == request.ConfidentialityLevel.Value);
        }

        if (request.DateFrom.HasValue)
        {
            query = query.Where(d => d.UploadedAt >= request.DateFrom.Value);
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(d => d.UploadedAt <= request.DateTo.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply ordering (newest first) and pagination
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .OrderByDescending(d => d.UploadedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new LegalDocumentListItemDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                ConfidentialityLevel = d.ConfidentialityLevel,
                FileName = d.FileName,
                ContentType = d.ContentType,
                FileSize = d.FileSize,
                Version = d.Version,
                UploadedAt = d.UploadedAt,
                UploadedBy = d.UploadedBy
            })
            .ToListAsync(cancellationToken);

        return PagedResult<LegalDocumentListItemDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
