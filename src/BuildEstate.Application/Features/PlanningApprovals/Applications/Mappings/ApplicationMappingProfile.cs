using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Domain.Entities.PlanningApprovals;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Mappings;

/// <summary>
/// AutoMapper profile for mapping PlanningApplication entities to Application DTOs.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class ApplicationMappingProfile : Profile
{
    public ApplicationMappingProfile()
    {
        CreateMap<PlanningApplication, ApplicationDto>()
            .ForMember(dest => dest.ApplicationType, opt => opt.MapFrom(src => src.ApplicationType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
