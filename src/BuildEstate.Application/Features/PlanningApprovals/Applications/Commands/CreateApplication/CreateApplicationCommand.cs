using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.CreateApplication;

/// <summary>
/// Command to create a new planning application linked to an acquired land opportunity.
/// </summary>
public sealed record CreateApplicationCommand : IRequest<ApplicationDto>
{
    public Guid OpportunityId { get; init; }
    public PlanningApplicationType ApplicationType { get; init; }
    public string Description { get; init; } = string.Empty;
    public string CouncilName { get; init; } = string.Empty;
}
