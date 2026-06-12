using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Queries.GetDocuments;

/// <summary>
/// Handles retrieval of a paginated list of planning documents for a given application,
/// optionally filtered by DocumentType. Uses AsNoTracking with projection to DocumentDto
/// for optimised read-only performance.
/// </summary>
public sealed class GetDocumentsQueryHandler
    : IRequestHandler<GetDocumentsQuery, PagedResult<DocumentDto>>
{
    private readonly IRepository<PlanningDocument> _documentRepository;

    public GetDocumentsQueryHandler(IRepository<PlanningDocument> documentRepository)
    {
        _documentRepository = documentRepository;
    }

    public async Task<PagedResult<DocumentDto>> Handle(
        GetDocumentsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _documentRepository.Query()
            .AsNoTracking()
            .Where(d => d.ApplicationId == request.ApplicationId);

        // Apply optional DocumentType filter
        if (request.DocumentType.HasValue)
        {
            query = query.Where(d => d.DocumentType == request.DocumentType.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination with default guards
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .OrderByDescending(d => d.UploadedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DocumentDto
            {
                Id = d.Id,
                ApplicationId = d.ApplicationId,
                DocumentType = d.DocumentType.ToString(),
                FileName = d.FileName,
                ContentType = d.ContentType,
                FileSizeBytes = d.FileSizeBytes,
                StoragePath = d.StoragePath,
                UploadedAt = d.UploadedAt,
                UploadedBy = d.UploadedBy,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<DocumentDto>.Create(items, totalCount, pageNumber, pageSize);
    }
}
