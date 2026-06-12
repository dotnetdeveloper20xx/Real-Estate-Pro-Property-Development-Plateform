using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using BuildEstate.Domain.Entities.PlanningApprovals;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Mappings;

/// <summary>
/// AutoMapper profile for mapping PlanningAppeal entities to Appeal DTOs.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class AppealMappingProfile : Profile
{
    public AppealMappingProfile()
    {
        CreateMap<PlanningAppeal, AppealDto>()
            .ForMember(dest => dest.AppealType, opt => opt.MapFrom(src => src.AppealType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.AppealOutcomeType, opt => opt.MapFrom(src => src.AppealOutcomeType != null ? src.AppealOutcomeType.ToString() : null));
    }
}
