using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Commands.CreateCouncilContact;

/// <summary>
/// Command to create a new council contact for a planning application.
/// </summary>
public sealed record CreateCouncilContactCommand : IRequest<CouncilContactDto>
{
    public Guid ApplicationId { get; init; }
    public string CouncilName { get; init; } = string.Empty;
    public string PlanningOfficerName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
}
