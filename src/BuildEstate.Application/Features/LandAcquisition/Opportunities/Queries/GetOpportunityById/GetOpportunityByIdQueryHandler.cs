using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunityById;

/// <summary>
/// Handles retrieval of a single opportunity with all navigation properties
/// eager-loaded for the detail view.
/// Throws EntityNotFoundException if the opportunity does not exist.
/// </summary>
public sealed class GetOpportunityByIdQueryHandler
    : IRequestHandler<GetOpportunityByIdQuery, OpportunityDetailDto?>
{
    private readonly IRepository<LandOpportunity> _repository;
    private readonly IMapper _mapper;

    public GetOpportunityByIdQueryHandler(
        IRepository<LandOpportunity> repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<OpportunityDetailDto?> Handle(
        GetOpportunityByIdQuery request,
        CancellationToken cancellationToken)
    {
        var opportunity = await _repository
            .Query()
            .AsNoTracking()
            .Include(x => x.LandOwner)
            .Include(x => x.DueDiligences)
            .Include(x => x.Offers)
            .Include(x => x.Documents)
            .Include(x => x.Contract)
            .Include(x => x.FeasibilityAssessment)
            .Include(x => x.ApprovalRequests)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.Id);
        }

        return _mapper.Map<OpportunityDetailDto>(opportunity);
    }
}
