using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Documents.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Queries.GetDocumentsByOpportunity;

/// <summary>
/// Handles retrieval of documents for a given opportunity,
/// optionally filtered by DocType, using AsNoTracking for read performance.
/// </summary>
public sealed class GetDocumentsByOpportunityQueryHandler
    : IRequestHandler<GetDocumentsByOpportunityQuery, List<DocumentDto>>
{
    private readonly IRepository<Document> _documentRepository;
    private readonly IMapper _mapper;

    public GetDocumentsByOpportunityQueryHandler(
        IRepository<Document> documentRepository,
        IMapper mapper)
    {
        _documentRepository = documentRepository;
        _mapper = mapper;
    }

    public async Task<List<DocumentDto>> Handle(
        GetDocumentsByOpportunityQuery request,
        CancellationToken cancellationToken)
    {
        var query = _documentRepository.Query()
            .AsNoTracking()
            .Where(d => d.OpportunityId == request.OpportunityId);

        // Optionally filter by DocType
        if (request.DocType.HasValue)
        {
            query = query.Where(d => d.DocType == request.DocType.Value);
        }

        var documents = await query
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<DocumentDto>>(documents);
    }
}
