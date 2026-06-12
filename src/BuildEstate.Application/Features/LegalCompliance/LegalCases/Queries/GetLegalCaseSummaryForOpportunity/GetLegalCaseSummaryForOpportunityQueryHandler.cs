using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseSummaryForOpportunity;

/// <summary>
/// Handles retrieval of legal case summaries for a specific opportunity.
/// Calculates open contracts count (contracts not in terminal states:
/// Completed, Terminated, Expired, Cancelled, Closed, Rejected).
/// Uses AsNoTracking for read-only access.
/// </summary>
public sealed class GetLegalCaseSummaryForOpportunityQueryHandler
    : IRequestHandler<GetLegalCaseSummaryForOpportunityQuery, List<LegalCaseSummaryDto>>
{
    private readonly IRepository<LegalCase> _repository;

    /// <summary>
    /// Contract statuses considered terminal (not open).
    /// </summary>
    private static readonly LegalContractStatus[] TerminalContractStatuses =
    {
        LegalContractStatus.Completed,
        LegalContractStatus.Terminated,
        LegalContractStatus.Expired,
        LegalContractStatus.Cancelled,
        LegalContractStatus.Closed,
        LegalContractStatus.Rejected
    };

    public GetLegalCaseSummaryForOpportunityQueryHandler(IRepository<LegalCase> repository)
    {
        _repository = repository;
    }

    public async Task<List<LegalCaseSummaryDto>> Handle(
        GetLegalCaseSummaryForOpportunityQuery request,
        CancellationToken cancellationToken)
    {
        var summaries = await _repository
            .Query()
            .AsNoTracking()
            .Where(c => c.OpportunityId == request.OpportunityId)
            .Include(c => c.Contracts)
            .Select(c => new LegalCaseSummaryDto
            {
                Id = c.Id,
                CaseReference = c.CaseReference,
                Title = c.Title,
                Status = c.Status,
                Priority = c.Priority,
                CaseType = c.CaseType,
                OpenContractsCount = c.Contracts.Count(con =>
                    !TerminalContractStatuses.Contains(con.Status))
            })
            .ToListAsync(cancellationToken);

        return summaries;
    }
}
