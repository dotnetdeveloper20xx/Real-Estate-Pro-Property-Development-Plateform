namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

/// <summary>
/// Lightweight due diligence DTO used within the OpportunityDetailDto for nested display.
/// The full-featured DTO resides in the DueDiligence feature folder.
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
