using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Mappings;

/// <summary>
/// AutoMapper profile mapping DueDiligence entity to DueDiligenceDto.
/// Type and Status enums are mapped to their string representations.
/// </summary>
public sealed class DueDiligenceMappingProfile : Profile
{
    public DueDiligenceMappingProfile()
    {
        CreateMap<Domain.Entities.LandAcquisition.DueDiligence, DueDiligenceDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
