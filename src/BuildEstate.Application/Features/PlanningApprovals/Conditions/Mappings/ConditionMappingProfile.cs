using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Domain.Entities.PlanningApprovals;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Mappings;

/// <summary>
/// AutoMapper profile for mapping PlanningCondition entities to Condition DTOs.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class ConditionMappingProfile : Profile
{
    public ConditionMappingProfile()
    {
        CreateMap<PlanningCondition, ConditionDto>()
            .ForMember(dest => dest.ConditionType, opt => opt.MapFrom(src => src.ConditionType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
