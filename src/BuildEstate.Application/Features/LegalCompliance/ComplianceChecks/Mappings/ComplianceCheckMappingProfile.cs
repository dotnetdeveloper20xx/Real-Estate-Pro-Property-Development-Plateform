using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.DTOs;
using BuildEstate.Domain.Entities.LegalCompliance;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Mappings;

/// <summary>
/// AutoMapper profile for mapping ComplianceCheck entities to ComplianceCheck DTOs.
/// Includes explicit member configurations for enum fields.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class ComplianceCheckMappingProfile : Profile
{
    public ComplianceCheckMappingProfile()
    {
        CreateMap<ComplianceCheck, ComplianceCheckDto>()
            .ForMember(dest => dest.Outcome, opt => opt.MapFrom(src => src.Outcome));
    }
}
