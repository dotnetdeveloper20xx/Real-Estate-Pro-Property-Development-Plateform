using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseSummaryForPlanning;

/// <summary>
/// Query to retrieve legal case summaries for a specific planning application.
/// Returns lightweight DTOs suitable for cross-module integration,
/// including a count of open (non-terminal) contracts per case.
/// </summary>
public sealed record GetLegalCaseSummaryForPlanningQuery : IRequest<List<LegalCaseSummaryDto>>
{
    public Guid PlanningApplicationId { get; init; }
}
