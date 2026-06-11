namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;

/// <summary>
/// Data transfer object representing a due diligence check associated with a land opportunity.
/// Type and Status are returned as string representations for API consumers.
/// </summary>
public sealed record DueDiligenceDto
{
    public Guid Id { get; init; }
    public Guid OpportunityId { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? Findings { get; init; }
    public DateTime? ReportDate { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
