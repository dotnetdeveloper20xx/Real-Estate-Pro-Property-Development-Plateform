using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.UpdateApplication;

/// <summary>
/// Command to update an existing planning application's editable fields.
/// Allows changing Description, ApplicationType, CouncilName, and TargetDecisionDate.
/// </summary>
public sealed record UpdateApplicationCommand : IRequest<ApplicationDto>
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public PlanningApplicationType ApplicationType { get; init; }
    public string CouncilName { get; init; } = string.Empty;
    public DateTime? TargetDecisionDate { get; init; }
}
