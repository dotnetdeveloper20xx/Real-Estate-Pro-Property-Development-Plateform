using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using BuildEstate.Domain.Entities.LandAcquisition;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Mappings;

/// <summary>
/// AutoMapper profile mapping ApprovalRequest entity to ApprovalRequestDto.
/// Maps the Status enum to its string representation.
/// </summary>
public sealed class ApprovalRequestMappingProfile : Profile
{
    public ApprovalRequestMappingProfile()
    {
        CreateMap<ApprovalRequest, ApprovalRequestDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}
