using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;

/// <summary>
/// DTO for the request body when creating a new planning application.
/// </summary>
public sealed record CreateApplicationDto
{
    public Guid OpportunityId { get; init; }
    public PlanningApplicationType ApplicationType { get; init; }
    public string Description { get; init; } = string.Empty;
    public string CouncilName { get; init; } = string.Empty;
}
