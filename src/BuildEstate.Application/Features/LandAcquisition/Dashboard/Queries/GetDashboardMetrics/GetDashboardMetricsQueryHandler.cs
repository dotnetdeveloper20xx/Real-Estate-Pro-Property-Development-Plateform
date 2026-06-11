using BuildEstate.Application.Features.LandAcquisition.Dashboard.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

using DueDiligenceEntity = BuildEstate.Domain.Entities.LandAcquisition.DueDiligence;

namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetDashboardMetrics;

/// <summary>
/// Handles calculation of dashboard KPI metrics by querying opportunity
/// and due diligence data. All queries use AsNoTracking for read-only access.
/// </summary>
public sealed class GetDashboardMetricsQueryHandler
    : IRequestHandler<GetDashboardMetricsQuery, DashboardMetricsDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<DueDiligenceEntity> _dueDiligenceRepository;

    public GetDashboardMetricsQueryHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<DueDiligenceEntity> dueDiligenceRepository)
    {
        _opportunityRepository = opportunityRepository;
        _dueDiligenceRepository = dueDiligenceRepository;
    }

    public async Task<DashboardMetricsDto> Handle(
        GetDashboardMetricsQuery request,
        CancellationToken cancellationToken)
    {
        var opportunities = _opportunityRepository.Query().AsNoTracking();

        // OpportunitiesByStatus: Group all opportunities by Status, count each
        var statusGroups = await opportunities
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var opportunitiesByStatus = statusGroups
            .ToDictionary(g => g.Status.ToString(), g => g.Count);

        // AverageAcquisitionCycleDays: For opportunities with Status == Acquired,
        // AVG(UpdatedAt - CreatedAt).TotalDays (use UpdatedAt as proxy for acquired date)
        var acquiredOpportunities = await opportunities
            .Where(o => o.Status == OpportunityStatus.Acquired && o.UpdatedAt != null)
            .Select(o => new { o.CreatedAt, o.UpdatedAt })
            .ToListAsync(cancellationToken);

        var averageAcquisitionCycleDays = acquiredOpportunities.Count > 0
            ? acquiredOpportunities.Average(o => (o.UpdatedAt!.Value - o.CreatedAt).TotalDays)
            : 0.0;

        // ConversionRatePercent: (Count where Status == Acquired / Total Count) * 100
        var totalCount = await opportunities.CountAsync(cancellationToken);
        var acquiredCount = statusGroups
            .FirstOrDefault(g => g.Status == OpportunityStatus.Acquired)?.Count ?? 0;

        var conversionRatePercent = totalCount > 0
            ? (double)acquiredCount / totalCount * 100.0
            : 0.0;

        // DueDiligencePassRatePercent: (Count DD with Status == Completed / Total DD Count) * 100
        var dueDiligences = _dueDiligenceRepository.Query().AsNoTracking();
        var totalDdCount = await dueDiligences.CountAsync(cancellationToken);
        var completedDdCount = await dueDiligences
            .CountAsync(dd => dd.Status == DueDiligenceStatus.Completed, cancellationToken);

        var dueDiligencePassRatePercent = totalDdCount > 0
            ? (double)completedDdCount / totalDdCount * 100.0
            : 0.0;

        // TotalEvaluated: Count where Status != Identified (i.e., Status > Identified)
        var totalEvaluated = statusGroups
            .Where(g => g.Status != OpportunityStatus.Identified)
            .Sum(g => g.Count);

        return new DashboardMetricsDto
        {
            OpportunitiesByStatus = opportunitiesByStatus,
            AverageAcquisitionCycleDays = Math.Round(averageAcquisitionCycleDays, 2),
            ConversionRatePercent = Math.Round(conversionRatePercent, 2),
            DueDiligencePassRatePercent = Math.Round(dueDiligencePassRatePercent, 2),
            TotalEvaluated = totalEvaluated
        };
    }
}
