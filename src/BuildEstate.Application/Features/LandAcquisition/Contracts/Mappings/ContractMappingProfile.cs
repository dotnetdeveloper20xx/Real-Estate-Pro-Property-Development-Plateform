using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;

namespace BuildEstate.Application.Features.LandAcquisition.Contracts.Mappings;

/// <summary>
/// AutoMapper profile mapping Contract entity to ContractDto.
/// </summary>
public sealed class ContractMappingProfile : Profile
{
    public ContractMappingProfile()
    {
        CreateMap<Contract, ContractDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
