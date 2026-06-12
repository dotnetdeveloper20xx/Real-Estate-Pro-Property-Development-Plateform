using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;

/// <summary>
/// Lightweight legal case DTO optimized for list views with minimal fields.
/// Includes days since last status change for at-a-glance workload assessment.
/// </summary>
public sealed record LegalCaseListItemDto
{
    public Guid Id { get; init; }
    public string CaseReference { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public LegalCaseType CaseType { get; init; }
    public LegalCaseStatus Status { get; init; }
    public LegalCasePriority Priority { get; init; }
    public string? AssignedSolicitor { get; init; }
    public Guid? OpportunityId { get; init; }
    public DateTime CreatedAt { get; init; }
    public int DaysSinceLastStatusChange { get; init; }
}
