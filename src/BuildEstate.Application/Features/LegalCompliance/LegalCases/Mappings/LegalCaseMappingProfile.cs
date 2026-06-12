using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Entities.LegalCompliance;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Mappings;

/// <summary>
/// AutoMapper profile for mapping LegalCase entities to Legal Case DTOs.
/// Includes explicit member configurations for all DTO variants.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class LegalCaseMappingProfile : Profile
{
    public LegalCaseMappingProfile()
    {
        // Full DTO — all properties map by convention from entity
        CreateMap<LegalCase, LegalCaseDto>()
            .ForMember(dest => dest.CaseType, opt => opt.MapFrom(src => src.CaseType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority));

        // List item DTO — lightweight for table/list views
        CreateMap<LegalCase, LegalCaseListItemDto>()
            .ForMember(dest => dest.CaseType, opt => opt.MapFrom(src => src.CaseType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
            .ForMember(dest => dest.DaysSinceLastStatusChange, opt => opt.Ignore());

        // Detail DTO — full entity plus related collections and state machine info
        CreateMap<LegalCase, LegalCaseDetailDto>()
            .ForMember(dest => dest.CaseType, opt => opt.MapFrom(src => src.CaseType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
            .ForMember(dest => dest.Contracts, opt => opt.MapFrom(src => src.Contracts))
            .ForMember(dest => dest.Documents, opt => opt.MapFrom(src => src.Documents))
            .ForMember(dest => dest.InsuranceRecords, opt => opt.MapFrom(src => src.InsuranceRecords))
            .ForMember(dest => dest.PermittedTransitions, opt => opt.Ignore());

        // Summary DTO — cross-module integration
        CreateMap<LegalCase, LegalCaseSummaryDto>()
            .ForMember(dest => dest.CaseType, opt => opt.MapFrom(src => src.CaseType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
            .ForMember(dest => dest.OpenContractsCount, opt => opt.Ignore());

        // Nested Contract DTO used within LegalCaseDetailDto
        CreateMap<Contract, DTOs.ContractDto>()
            .ForMember(dest => dest.ContractType, opt => opt.MapFrom(src => src.ContractType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));

        // Nested InsuranceRecord DTO used within LegalCaseDetailDto
        CreateMap<InsuranceRecord, DTOs.InsuranceRecordDto>()
            .ForMember(dest => dest.CoverageType, opt => opt.MapFrom(src => src.CoverageType))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));

        // Nested LegalDocument DTO used within LegalCaseDetailDto
        CreateMap<LegalDocument, DTOs.LegalDocumentDto>()
            .ForMember(dest => dest.DocumentType, opt => opt.MapFrom(src => src.DocumentType))
            .ForMember(dest => dest.ConfidentialityLevel, opt => opt.MapFrom(src => src.ConfidentialityLevel));
    }
}
