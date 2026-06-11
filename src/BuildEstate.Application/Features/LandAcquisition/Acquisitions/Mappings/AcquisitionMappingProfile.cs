using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Acquisitions.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;

namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.Mappings;

/// <summary>
/// AutoMapper profile mapping LandAcquisitionRecord entity to AcquisitionDto.
/// </summary>
public sealed class AcquisitionMappingProfile : Profile
{
    public AcquisitionMappingProfile()
    {
        CreateMap<LandAcquisitionRecord, AcquisitionDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
