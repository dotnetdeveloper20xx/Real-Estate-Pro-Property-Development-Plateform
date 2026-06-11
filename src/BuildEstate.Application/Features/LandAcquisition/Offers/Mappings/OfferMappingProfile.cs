using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Mappings;

/// <summary>
/// AutoMapper profile mapping Offer entity to OfferDto.
/// </summary>
public sealed class OfferMappingProfile : Profile
{
    public OfferMappingProfile()
    {
        CreateMap<Offer, OfferDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
