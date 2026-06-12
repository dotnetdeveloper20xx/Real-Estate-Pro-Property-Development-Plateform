using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceStatusSummary;

/// <summary>
/// Handles retrieval of compliance status summary totals grouped by category.
/// For each category, counts total active requirements, compliant (last check Compliant),
/// non-compliant (last check NonCompliant), and overdue (NextDueDate passed with no check for the period).
/// </summary>
public sealed class GetComplianceStatusSummaryQueryHandler
    : IRequestHandler<GetComplianceStatusSummaryQuery, List<ComplianceStatusSummaryDto>>
{
    private readonly IRepository<ComplianceRequirement> _repository;

    public GetComplianceStatusSummaryQueryHandler(IRepository<ComplianceRequirement> repository)
    {
        _repository = repository;
    }

    public async Task<List<ComplianceStatusSummaryDto>> Handle(
        GetComplianceStatusSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var requirements = await _repository.Query()
            .AsNoTracking()
            .Where(r => r.Status == ComplianceRequirementStatus.Active)
            .Select(r => new
            {
                r.Category,
                r.NextDueDate,
                LastCheckOutcome = r.Checks
                    .OrderByDescending(c => c.CheckDate)
                    .Select(c => (ComplianceCheckOutcome?)c.Outcome)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var summary = requirements
            .GroupBy(r => r.Category)
            .Select(g => new ComplianceStatusSummaryDto
            {
                Category = g.Key,
                TotalRequirements = g.Count(),
                CompliantCount = g.Count(r => r.LastCheckOutcome == ComplianceCheckOutcome.Compliant),
                NonCompliantCount = g.Count(r => r.LastCheckOutcome == ComplianceCheckOutcome.NonCompliant),
                OverdueCount = g.Count(r =>
                    r.NextDueDate.HasValue &&
                    r.NextDueDate.Value < now &&
                    r.LastCheckOutcome != ComplianceCheckOutcome.Compliant)
            })
            .OrderBy(s => s.Category)
            .ToList();

        return summary;
    }
}
