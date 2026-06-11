using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Feasibility.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;

namespace BuildEstate.Application.Features.LandAcquisition.Feasibility.Mappings;

/// <summary>
/// AutoMapper profile for mapping FeasibilityAssessment entities to FeasibilityAssessmentDto.
/// Converts the Scenario enum to its string representation.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class FeasibilityMappingProfile : Profile
{
    public FeasibilityMappingProfile()
    {
        CreateMap<FeasibilityAssessment, FeasibilityAssessmentDto>()
            .ForMember(dest => dest.Scenario, opt => opt.MapFrom(src => src.Scenario.ToString()));
    }
}
