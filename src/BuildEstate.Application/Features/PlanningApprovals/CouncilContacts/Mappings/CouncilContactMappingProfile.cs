using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;
using BuildEstate.Domain.Entities.PlanningApprovals;

namespace BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Mappings;

/// <summary>
/// AutoMapper profile for mapping CouncilContact entities to CouncilContactDto.
/// Registered automatically via assembly scanning in DependencyInjection.
/// </summary>
public sealed class CouncilContactMappingProfile : Profile
{
    public CouncilContactMappingProfile()
    {
        CreateMap<CouncilContact, CouncilContactDto>();
    }
}
