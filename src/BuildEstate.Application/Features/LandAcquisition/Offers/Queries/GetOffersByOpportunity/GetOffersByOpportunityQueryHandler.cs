using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Queries.GetOffersByOpportunity;

/// <summary>
/// Handles retrieval of all offers for a given opportunity,
/// ordered by OfferDate descending using AsNoTracking for read performance.
/// </summary>
public sealed class GetOffersByOpportunityQueryHandler
    : IRequestHandler<GetOffersByOpportunityQuery, List<OfferDto>>
{
    private readonly IRepository<Offer> _offerRepository;
    private readonly IMapper _mapper;

    public GetOffersByOpportunityQueryHandler(
        IRepository<Offer> offerRepository,
        IMapper mapper)
    {
        _offerRepository = offerRepository;
        _mapper = mapper;
    }

    public async Task<List<OfferDto>> Handle(
        GetOffersByOpportunityQuery request,
        CancellationToken cancellationToken)
    {
        var offers = await _offerRepository.Query()
            .AsNoTracking()
            .Where(o => o.OpportunityId == request.OpportunityId)
            .OrderByDescending(o => o.OfferDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<OfferDto>>(offers);
    }
}
