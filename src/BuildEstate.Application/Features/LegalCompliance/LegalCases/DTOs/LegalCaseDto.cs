using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;

/// <summary>
/// Full legal case representation containing all case fields.
/// Used for create/update responses and general purpose display.
/// </summary>
public sealed record LegalCaseDto
{
    public Guid Id { get; init; }
    public string CaseReference { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public LegalCaseType CaseType { get; init; }
    public LegalCaseStatus Status { get; init; }
    public LegalCasePriority Priority { get; init; }
    public string? AssignedSolicitor { get; init; }
    public string? SolicitorFirm { get; init; }
    public string? SolicitorEmail { get; init; }
    public string? SolicitorPhone { get; init; }
    public string? Notes { get; init; }
    public string? ResolutionSummary { get; init; }
    public DateTime? ResolutionDate { get; init; }
    public string? EscalationReason { get; init; }
    public string? HoldReason { get; init; }
    public Guid? OpportunityId { get; init; }
    public Guid? PlanningApplicationId { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? UpdatedAt { get; init; }
    public string? UpdatedBy { get; init; }
}
