using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseSummaryForOpportunity;

/// <summary>
/// Query to retrieve legal case summaries for a specific land opportunity.
/// Returns lightweight DTOs suitable for cross-module integration,
/// including a count of open (non-terminal) contracts per case.
/// </summary>
public sealed record GetLegalCaseSummaryForOpportunityQuery : IRequest<List<LegalCaseSummaryDto>>
{
    public Guid OpportunityId { get; init; }
}
