using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Domain.Entities.LegalCompliance;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Mappings;

/// <summary>
/// AutoMapper profile for mapping InsuranceRecord entities to Insurance DTOs.
/// Includes explicit member configurations for enum fields and handler-populated computed fields.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class InsuranceRecordMappingProfile : Profile
{
    public InsuranceRecordMappingProfile()
    {
        // Standard DTO — all properties map by convention
        CreateMap<InsuranceRecord, InsuranceRecordDto>()
            .ForMember(dest => dest.CoverageType, opt => opt.MapFrom(src => src.CoverageType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));

        // Detail DTO — includes computed fields populated by handler
        CreateMap<InsuranceRecord, InsuranceRecordDetailDto>()
            .ForMember(dest => dest.CoverageType, opt => opt.MapFrom(src => src.CoverageType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.PermittedTransitions, opt => opt.Ignore())
            .ForMember(dest => dest.DaysUntilExpiry, opt => opt.Ignore())
            .ForMember(dest => dest.LegalCaseReference, opt => opt.Ignore());

        // List item DTO — lightweight for table views
        CreateMap<InsuranceRecord, InsuranceRecordListItemDto>()
            .ForMember(dest => dest.CoverageType, opt => opt.MapFrom(src => src.CoverageType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.DaysUntilExpiry, opt => opt.Ignore());
    }
}
