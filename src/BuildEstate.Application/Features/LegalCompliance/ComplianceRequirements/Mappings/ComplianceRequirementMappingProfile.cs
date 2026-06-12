using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Entities.LegalCompliance;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Mappings;

/// <summary>
/// AutoMapper profile for mapping ComplianceRequirement entities to Compliance Requirement DTOs.
/// Includes explicit member configurations for computed and handler-populated fields.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class ComplianceRequirementMappingProfile : Profile
{
    public ComplianceRequirementMappingProfile()
    {
        // Standard DTO — all properties map by convention from entity
        CreateMap<ComplianceRequirement, ComplianceRequirementDto>()
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
            .ForMember(dest => dest.Frequency, opt => opt.MapFrom(src => src.Frequency))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));

        // Detail DTO — extends base with computed fields populated by handler
        CreateMap<ComplianceRequirement, ComplianceRequirementDetailDto>()
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
            .ForMember(dest => dest.Frequency, opt => opt.MapFrom(src => src.Frequency))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.RecentChecks, opt => opt.Ignore())
            .ForMember(dest => dest.LastCheckOutcome, opt => opt.Ignore())
            .ForMember(dest => dest.TotalChecksCount, opt => opt.Ignore());
    }
}
