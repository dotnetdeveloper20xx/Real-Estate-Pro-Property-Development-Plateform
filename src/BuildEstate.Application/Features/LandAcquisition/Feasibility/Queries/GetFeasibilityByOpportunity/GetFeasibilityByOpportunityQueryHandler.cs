using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Feasibility.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Feasibility.Queries.GetFeasibilityByOpportunity;

/// <summary>
/// Handles retrieval of a feasibility assessment by OpportunityId.
/// Uses AsNoTracking for read performance and returns null if no assessment exists.
/// </summary>
public sealed class GetFeasibilityByOpportunityQueryHandler
    : IRequestHandler<GetFeasibilityByOpportunityQuery, FeasibilityAssessmentDto?>
{
    private readonly IRepository<FeasibilityAssessment> _feasibilityRepository;
    private readonly IMapper _mapper;

    public GetFeasibilityByOpportunityQueryHandler(
        IRepository<FeasibilityAssessment> feasibilityRepository,
        IMapper mapper)
    {
        _feasibilityRepository = feasibilityRepository;
        _mapper = mapper;
    }

    public async Task<FeasibilityAssessmentDto?> Handle(
        GetFeasibilityByOpportunityQuery request,
        CancellationToken cancellationToken)
    {
        var assessment = await _feasibilityRepository.Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.OpportunityId == request.OpportunityId, cancellationToken);

        if (assessment is null)
        {
            return null;
        }

        return _mapper.Map<FeasibilityAssessmentDto>(assessment);
    }
}
