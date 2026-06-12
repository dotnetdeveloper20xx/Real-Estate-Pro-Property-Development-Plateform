namespace BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;

/// <summary>
/// Data transfer object for CouncilContact entity.
/// </summary>
public sealed record CouncilContactDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string CouncilName { get; init; } = string.Empty;
    public string PlanningOfficerName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
