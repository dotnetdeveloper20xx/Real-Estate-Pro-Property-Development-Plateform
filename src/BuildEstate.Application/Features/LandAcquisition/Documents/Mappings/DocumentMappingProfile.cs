using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Documents.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Mappings;

/// <summary>
/// AutoMapper profile mapping Document entity to DocumentDto.
/// DocType is mapped as its string representation.
/// </summary>
public sealed class DocumentMappingProfile : Profile
{
    public DocumentMappingProfile()
    {
        CreateMap<Document, DocumentDto>()
            .ForMember(dest => dest.DocType, opt => opt.MapFrom(src => src.DocType.ToString()));
    }
}
