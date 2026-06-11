using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;
using BuildEstate.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Queries.GetDueDiligenceByOpportunity;

/// <summary>
/// Handles retrieval of due diligence records by opportunity Id with optional Type and Status filters.
/// Uses AsNoTracking for optimised read-only queries.
/// </summary>
public sealed class GetDueDiligenceByOpportunityQueryHandler
    : IRequestHandler<GetDueDiligenceByOpportunityQuery, List<DueDiligenceDto>>
{
    private readonly IRepository<Domain.Entities.LandAcquisition.DueDiligence> _dueDiligenceRepository;
    private readonly IMapper _mapper;

    public GetDueDiligenceByOpportunityQueryHandler(
        IRepository<Domain.Entities.LandAcquisition.DueDiligence> dueDiligenceRepository,
        IMapper mapper)
    {
        _dueDiligenceRepository = dueDiligenceRepository;
        _mapper = mapper;
    }

    public async Task<List<DueDiligenceDto>> Handle(
        GetDueDiligenceByOpportunityQuery request,
        CancellationToken cancellationToken)
    {
        var query = _dueDiligenceRepository
            .Query()
            .AsNoTracking()
            .Where(dd => dd.OpportunityId == request.OpportunityId);

        // Apply optional Type filter
        if (request.Type.HasValue)
        {
            query = query.Where(dd => dd.Type == request.Type.Value);
        }

        // Apply optional Status filter
        if (request.Status.HasValue)
        {
            query = query.Where(dd => dd.Status == request.Status.Value);
        }

        var results = await query
            .OrderByDescending(dd => dd.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<DueDiligenceDto>>(results);
    }
}
