using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.CreateLegalCase;

/// <summary>
/// Command to create a new legal case linked to a land opportunity or planning application.
/// </summary>
public sealed record CreateLegalCaseCommand : IRequest<LegalCaseDto>
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public LegalCaseType CaseType { get; init; }
    public LegalCasePriority Priority { get; init; }
    public Guid? OpportunityId { get; init; }
    public Guid? PlanningApplicationId { get; init; }
}
