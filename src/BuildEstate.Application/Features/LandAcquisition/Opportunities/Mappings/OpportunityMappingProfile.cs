using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;
using DueDiligenceEntity = BuildEstate.Domain.Entities.LandAcquisition.DueDiligence;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Mappings;

/// <summary>
/// AutoMapper profile for mapping LandOpportunity entities to Opportunity DTOs.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class OpportunityMappingProfile : Profile
{
    public OpportunityMappingProfile()
    {
        CreateMap<LandOpportunity, OpportunityDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<LandOpportunity, OpportunityListItemDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<LandOpportunity, OpportunityDetailDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        // Navigation property mappings for detail DTO
        CreateMap<LandOwner, LandOwnerDto>();
        CreateMap<DueDiligenceEntity, DueDiligenceDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<Offer, OfferDto>();
        CreateMap<Document, DocumentDto>();
        CreateMap<Contract, ContractDto>();
        CreateMap<FeasibilityAssessment, FeasibilityDto>();
    }
}
