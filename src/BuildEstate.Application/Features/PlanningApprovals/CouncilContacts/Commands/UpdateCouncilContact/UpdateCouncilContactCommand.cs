using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Commands.UpdateCouncilContact;

/// <summary>
/// Command to update an existing council contact's details.
/// </summary>
public sealed record UpdateCouncilContactCommand : IRequest<CouncilContactDto>
{
    public Guid Id { get; init; }
    public string CouncilName { get; init; } = string.Empty;
    public string PlanningOfficerName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
}
