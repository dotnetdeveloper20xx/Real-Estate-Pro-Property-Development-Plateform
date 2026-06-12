using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;

/// <summary>
/// Pipeline/kanban column DTO grouping cases by their current status.
/// Used for the visual pipeline board view.
/// </summary>
public sealed record LegalCasePipelineDto
{
    public LegalCaseStatus Status { get; init; }
    public List<LegalCaseListItemDto> Cases { get; init; } = new();
    public int Count { get; init; }
}
