using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;
using BuildEstate.Domain.Entities.LegalCompliance;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Mappings;

/// <summary>
/// AutoMapper profile for mapping AuditRecord entities to AuditRecord DTOs.
/// Enums are mapped to their string representation for API serialization.
/// Includes explicit member configurations for handler-populated computed fields.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class AuditRecordMappingProfile : Profile
{
    public AuditRecordMappingProfile()
    {
        // Full DTO — enums mapped to string
        CreateMap<AuditRecord, AuditRecordDto>()
            .ForMember(dest => dest.AuditType, opt => opt.MapFrom(src => src.AuditType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.RiskRating, opt => opt.MapFrom(src => src.RiskRating != null ? src.RiskRating.ToString() : null));

        // Detail DTO — includes computed fields populated by handler
        CreateMap<AuditRecord, AuditRecordDetailDto>()
            .ForMember(dest => dest.AuditType, opt => opt.MapFrom(src => src.AuditType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.RiskRating, opt => opt.MapFrom(src => src.RiskRating != null ? src.RiskRating.ToString() : null))
            .ForMember(dest => dest.PermittedTransitions, opt => opt.Ignore())
            .ForMember(dest => dest.DaysUntilActionDue, opt => opt.Ignore())
            .ForMember(dest => dest.LegalCaseReference, opt => opt.Ignore())
            .ForMember(dest => dest.ComplianceRequirementName, opt => opt.Ignore());

        // List item DTO — lightweight for table views
        CreateMap<AuditRecord, AuditRecordListItemDto>()
            .ForMember(dest => dest.AuditType, opt => opt.MapFrom(src => src.AuditType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.RiskRating, opt => opt.MapFrom(src => src.RiskRating != null ? src.RiskRating.ToString() : null));
    }
}
