using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using BuildEstate.Domain.Entities.LegalCompliance;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Mappings;

/// <summary>
/// AutoMapper profile for mapping LegalDocument entities to Legal Document DTOs.
/// Includes explicit member configurations for enum fields.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class LegalDocumentMappingProfile : Profile
{
    public LegalDocumentMappingProfile()
    {
        // Full DTO — all properties map by convention, enums kept as typed values
        CreateMap<LegalDocument, LegalDocumentDto>()
            .ForMember(dest => dest.DocumentType, opt => opt.MapFrom(src => src.DocumentType))
            .ForMember(dest => dest.ConfidentialityLevel, opt => opt.MapFrom(src => src.ConfidentialityLevel));

        // List item DTO — lightweight for table views
        CreateMap<LegalDocument, LegalDocumentListItemDto>()
            .ForMember(dest => dest.DocumentType, opt => opt.MapFrom(src => src.DocumentType))
            .ForMember(dest => dest.ConfidentialityLevel, opt => opt.MapFrom(src => src.ConfidentialityLevel));
    }
}
