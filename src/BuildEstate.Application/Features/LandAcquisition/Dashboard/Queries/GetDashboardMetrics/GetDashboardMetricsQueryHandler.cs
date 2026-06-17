using BuildEstate.Application.Features.LandAcquisition.Dashboard.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

using DueDiligenceEntity = BuildEstate.Domain.Entities.LandAcquisition.DueDiligence;

namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetDashboardMetrics;

/// <summary>
/// Handles calculation of comprehensive dashboard metrics by querying opportunity,
/// due diligence, offer, approval, and feasibility data.
/// All queries use AsNoTracking for read-only access.
/// </summary>
public sealed class GetDashboardMetricsQueryHandler
    : IRequestHandler<GetDashboardMetricsQuery, DashboardMetricsDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<DueDiligenceEntity> _dueDiligenceRepository;
    private readonly IRepository<Offer> _offerRepository;
    private readonly IRepository<ApprovalRequest> _approvalRepository;
    private readonly IRepository<FeasibilityAssessment> _feasibilityRepository;
    private readonly IRepository<Document> _documentRepository;

    public GetDashboardMetricsQueryHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<DueDiligenceEntity> dueDiligenceRepository,
        IRepository<Offer> offerRepository,
        IRepository<ApprovalRequest> approvalRepository,
        IRepository<FeasibilityAssessment> feasibilityRepository,
        IRepository<Document> documentRepository)
    {
        _opportunityRepository = opportunityRepository;
        _dueDiligenceRepository = dueDiligenceRepository;
        _offerRepository = offerRepository;
        _approvalRepository = approvalRepository;
        _feasibilityRepository = feasibilityRepository;
        _documentRepository = documentRepository;
    }

    public async Task<DashboardMetricsDto> Handle(
        GetDashboardMetricsQuery request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysFromNow = now.AddDays(7);
        var fourteenDaysAgo = now.AddDays(-14);

        var opportunities = _opportunityRepository.Query().AsNoTracking();

        // ─── OpportunitiesByStatus ─────────────────────────────────────────
        var statusGroups = await opportunities
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var opportunitiesByStatus = statusGroups
            .ToDictionary(g => g.Status.ToString(), g => g.Count);

        // ─── AverageAcquisitionCycleDays ───────────────────────────────────
        var acquiredOpportunities = await opportunities
            .Where(o => o.Status == OpportunityStatus.Acquired && o.UpdatedAt != null)
            .Select(o => new { o.CreatedAt, o.UpdatedAt })
            .ToListAsync(cancellationToken);

        var averageAcquisitionCycleDays = acquiredOpportunities.Count > 0
            ? acquiredOpportunities.Average(o => (o.UpdatedAt!.Value - o.CreatedAt).TotalDays)
            : 0.0;

        // ─── ConversionRatePercent ─────────────────────────────────────────
        var totalCount = await opportunities.CountAsync(cancellationToken);
        var acquiredCount = statusGroups
            .FirstOrDefault(g => g.Status == OpportunityStatus.Acquired)?.Count ?? 0;

        var conversionRatePercent = totalCount > 0
            ? (double)acquiredCount / totalCount * 100.0
            : 0.0;

        // ─── DueDiligencePassRatePercent ───────────────────────────────────
        var dueDiligences = _dueDiligenceRepository.Query().AsNoTracking();
        var totalDdCount = await dueDiligences.CountAsync(cancellationToken);
        var completedDdCount = await dueDiligences
            .CountAsync(dd => dd.Status == DueDiligenceStatus.Completed, cancellationToken);

        var dueDiligencePassRatePercent = totalDdCount > 0
            ? (double)completedDdCount / totalDdCount * 100.0
            : 0.0;

        // ─── TotalEvaluated ────────────────────────────────────────────────
        var totalEvaluated = statusGroups
            .Where(g => g.Status != OpportunityStatus.Identified)
            .Sum(g => g.Count);

        // ─── Alerts: OffersExpiringSoon ────────────────────────────────────
        var offersExpiringSoon = await _offerRepository.Query().AsNoTracking()
            .CountAsync(o =>
                o.ValidUntil >= now &&
                o.ValidUntil <= sevenDaysFromNow &&
                o.Status != OfferStatus.Accepted &&
                o.Status != OfferStatus.Rejected &&
                o.Status != OfferStatus.Expired,
                cancellationToken);

        // ─── Alerts: OverdueDueDiligence ───────────────────────────────────
        var overdueDueDiligence = await dueDiligences
            .CountAsync(dd =>
                dd.Status == DueDiligenceStatus.InProgress &&
                dd.CreatedAt <= fourteenDaysAgo,
                cancellationToken);

        // ─── Alerts: ApprovalsPending ──────────────────────────────────────
        var approvalsPending = await _approvalRepository.Query().AsNoTracking()
            .CountAsync(a => a.Status == ApprovalStatus.Pending, cancellationToken);

        // ─── Top Opportunities (by expected sales revenue) ─────────────────
        var topOpportunities = await _feasibilityRepository.Query().AsNoTracking()
            .OrderByDescending(f => f.ExpectedSalesRevenue)
            .Take(5)
            .Select(f => new TopOpportunityDto
            {
                Id = f.OpportunityId,
                Name = f.Opportunity.Name,
                Location = f.Opportunity.Location,
                EstimatedValue = f.ExpectedSalesRevenue,
                Status = f.Opportunity.Status.ToString()
            })
            .ToListAsync(cancellationToken);

        // ─── Recent Activity (last 10 status changes) ──────────────────────
        var recentActivity = await opportunities
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Take(10)
            .Select(x => new RecentActivityItemDto
            {
                OpportunityId = x.Id,
                OpportunityName = x.Name,
                Status = x.Status.ToString(),
                Timestamp = x.UpdatedAt ?? x.CreatedAt,
                UserName = x.UpdatedBy ?? x.CreatedBy
            })
            .ToListAsync(cancellationToken);

        // ─── Activity by Type (last 30 days) ───────────────────────────────
        var ddActivityCount = await dueDiligences
            .CountAsync(dd => dd.CreatedAt >= thirtyDaysAgo || dd.UpdatedAt >= thirtyDaysAgo, cancellationToken);

        var offerActivityCount = await _offerRepository.Query().AsNoTracking()
            .CountAsync(o => o.CreatedAt >= thirtyDaysAgo || o.UpdatedAt >= thirtyDaysAgo, cancellationToken);

        var documentActivityCount = await _documentRepository.Query().AsNoTracking()
            .CountAsync(d => d.CreatedAt >= thirtyDaysAgo, cancellationToken);

        var opportunityActivityCount = await opportunities
            .CountAsync(o => o.CreatedAt >= thirtyDaysAgo || o.UpdatedAt >= thirtyDaysAgo, cancellationToken);

        var approvalActivityCount = await _approvalRepository.Query().AsNoTracking()
            .CountAsync(a => a.CreatedAt >= thirtyDaysAgo || a.UpdatedAt >= thirtyDaysAgo, cancellationToken);

        var activityByType = new Dictionary<string, int>
        {
            ["Due Diligence"] = ddActivityCount,
            ["Offers"] = offerActivityCount,
            ["Documents"] = documentActivityCount,
            ["Opportunities"] = opportunityActivityCount,
            ["Approvals"] = approvalActivityCount,
            ["Other"] = 0
        };

        return new DashboardMetricsDto
        {
            OpportunitiesByStatus = opportunitiesByStatus,
            AverageAcquisitionCycleDays = Math.Round(averageAcquisitionCycleDays, 2),
            ConversionRatePercent = Math.Round(conversionRatePercent, 2),
            DueDiligencePassRatePercent = Math.Round(dueDiligencePassRatePercent, 2),
            TotalEvaluated = totalEvaluated,
            OffersExpiringSoon = offersExpiringSoon,
            OverdueDueDiligence = overdueDueDiligence,
            ApprovalsPending = approvalsPending,
            TopOpportunities = topOpportunities,
            RecentActivity = recentActivity,
            ActivityByType = activityByType
        };
    }
}
