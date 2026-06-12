using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Domain.Entities.PlanningApprovals;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Mappings;

/// <summary>
/// AutoMapper profile for mapping PlanningFee entities to Fee DTOs.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class FeeMappingProfile : Profile
{
    public FeeMappingProfile()
    {
        CreateMap<PlanningFee, FeeDto>()
            .ForMember(dest => dest.FeeType, opt => opt.MapFrom(src => src.FeeType.ToString()))
            .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => src.PaymentStatus.ToString()));
    }
}
