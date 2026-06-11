using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Queries.GetLandOwnerByOpportunityId;

/// <summary>
/// Handles retrieval of a land owner by the associated opportunity Id.
/// </summary>
public sealed class GetLandOwnerByOpportunityIdQueryHandler
    : IRequestHandler<GetLandOwnerByOpportunityIdQuery, LandOwnerDto?>
{
    private readonly IRepository<LandOwner> _landOwnerRepository;
    private readonly IMapper _mapper;

    public GetLandOwnerByOpportunityIdQueryHandler(
        IRepository<LandOwner> landOwnerRepository,
        IMapper mapper)
    {
        _landOwnerRepository = landOwnerRepository;
        _mapper = mapper;
    }

    public async Task<LandOwnerDto?> Handle(
        GetLandOwnerByOpportunityIdQuery request,
        CancellationToken cancellationToken)
    {
        var landOwner = await _landOwnerRepository
            .Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OpportunityId == request.OpportunityId, cancellationToken);

        return landOwner is null ? null : _mapper.Map<LandOwnerDto>(landOwner);
    }
}
