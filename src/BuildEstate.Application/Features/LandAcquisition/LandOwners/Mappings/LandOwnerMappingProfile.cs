using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Mappings;

/// <summary>
/// AutoMapper profile for LandOwner entity to DTO mappings.
/// </summary>
public sealed class LandOwnerMappingProfile : Profile
{
    public LandOwnerMappingProfile()
    {
        CreateMap<LandOwner, LandOwnerDto>()
            .ForMember(dest => dest.OwnershipType, opt => opt.MapFrom(src => src.OwnershipType.ToString()));
    }
}
