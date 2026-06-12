using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using BuildEstate.Domain.Entities.PlanningApprovals;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Mappings;

/// <summary>
/// AutoMapper profile for mapping PlanningMilestone entities to Milestone DTOs.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class MilestoneMappingProfile : Profile
{
    public MilestoneMappingProfile()
    {
        CreateMap<PlanningMilestone, MilestoneDto>()
            .ForMember(dest => dest.MilestoneType, opt => opt.MapFrom(src => src.MilestoneType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
