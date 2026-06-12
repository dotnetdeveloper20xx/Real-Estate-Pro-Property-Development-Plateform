using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;
using BuildEstate.Domain.Entities.PlanningApprovals;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Mappings;

/// <summary>
/// AutoMapper profile mapping PlanningDocument entity to DocumentDto.
/// DocumentType is mapped as its string representation.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class DocumentMappingProfile : Profile
{
    public DocumentMappingProfile()
    {
        CreateMap<PlanningDocument, DocumentDto>()
            .ForMember(dest => dest.DocumentType, opt => opt.MapFrom(src => src.DocumentType.ToString()));
    }
}
