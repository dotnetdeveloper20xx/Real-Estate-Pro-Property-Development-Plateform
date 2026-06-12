using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Domain.Entities.LegalCompliance;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Mappings;

/// <summary>
/// AutoMapper profile for mapping Contract entities to Contract DTOs.
/// Includes explicit member configurations for enum-to-string conversions
/// and ignored members that are populated by handlers.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class ContractMappingProfile : Profile
{
    public ContractMappingProfile()
    {
        // Full DTO — enums mapped to string representation
        CreateMap<Contract, ContractDto>()
            .ForMember(dest => dest.ContractType, opt => opt.MapFrom(src => src.ContractType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        // Detail DTO — includes related documents, linked case, and permitted transitions
        CreateMap<Contract, ContractDetailDto>()
            .ForMember(dest => dest.ContractType, opt => opt.MapFrom(src => src.ContractType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Documents, opt => opt.Ignore())
            .ForMember(dest => dest.LegalCaseReference, opt => opt.Ignore())
            .ForMember(dest => dest.PermittedTransitions, opt => opt.Ignore());

        // List item DTO — lightweight for table views
        CreateMap<Contract, ContractListItemDto>()
            .ForMember(dest => dest.ContractType, opt => opt.MapFrom(src => src.ContractType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.LegalCaseReference, opt => opt.Ignore());

        // Register DTO — same structure as list item for the contract register view
        CreateMap<Contract, ContractRegisterDto>()
            .ForMember(dest => dest.ContractType, opt => opt.MapFrom(src => src.ContractType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.LegalCaseReference, opt => opt.Ignore());

        // Contract document DTO — maps LegalDocument to lightweight doc representation
        CreateMap<LegalDocument, ContractDocumentDto>()
            .ForMember(dest => dest.DocumentType, opt => opt.MapFrom(src => src.DocumentType.ToString()))
            .ForMember(dest => dest.ConfidentialityLevel, opt => opt.MapFrom(src => src.ConfidentialityLevel.ToString()));
    }
}
