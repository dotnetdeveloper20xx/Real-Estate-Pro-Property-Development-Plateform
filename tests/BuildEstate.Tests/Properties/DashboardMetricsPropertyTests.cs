using BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetDashboardMetrics;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

using DueDiligenceEntity = BuildEstate.Domain.Entities.LandAcquisition.DueDiligence;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Dashboard Metrics Correctness (Property 11).
/// Generates random opportunity and due diligence datasets, then verifies
/// the GetDashboardMetricsQueryHandler computes all metrics correctly.
///
/// **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
/// </summary>
public class DashboardMetricsPropertyTests
{
    private static readonly OpportunityStatus[] AllStatuses = Enum.GetValues<OpportunityStatus>();
    private static readonly DueDiligenceStatus[] AllDdStatuses = Enum.GetValues<DueDiligenceStatus>();

    /// <summary>
    /// Creates a mock handler with the given in-memory data sets.
    /// Additional repositories (Offer, ApprovalRequest, FeasibilityAssessment, Document)
    /// are mocked with empty collections since these tests focus on KPI calculations.
    /// </summary>
    private static GetDashboardMetricsQueryHandler CreateHandler(
        List<LandOpportunity> opportunities,
        List<DueDiligenceEntity> dueDiligences)
    {
        var opportunityRepoMock = new Mock<IRepository<LandOpportunity>>();
        opportunityRepoMock
            .Setup(r => r.Query())
            .Returns(opportunities.AsAsyncQueryable());

        var ddRepoMock = new Mock<IRepository<DueDiligenceEntity>>();
        ddRepoMock
            .Setup(r => r.Query())
            .Returns(dueDiligences.AsAsyncQueryable());

        var offerRepoMock = new Mock<IRepository<Offer>>();
        offerRepoMock
            .Setup(r => r.Query())
            .Returns(new List<Offer>().AsAsyncQueryable());

        var approvalRepoMock = new Mock<IRepository<ApprovalRequest>>();
        approvalRepoMock
            .Setup(r => r.Query())
            .Returns(new List<ApprovalRequest>().AsAsyncQueryable());

        var feasibilityRepoMock = new Mock<IRepository<FeasibilityAssessment>>();
        feasibilityRepoMock
            .Setup(r => r.Query())
            .Returns(new List<FeasibilityAssessment>().AsAsyncQueryable());

        var documentRepoMock = new Mock<IRepository<Document>>();
        documentRepoMock
            .Setup(r => r.Query())
            .Returns(new List<Document>().AsAsyncQueryable());

        return new GetDashboardMetricsQueryHandler(
            opportunityRepoMock.Object,
            ddRepoMock.Object,
            offerRepoMock.Object,
            approvalRepoMock.Object,
            feasibilityRepoMock.Object,
            documentRepoMock.Object);
    }

    /// <summary>
    /// Generates a random LandOpportunity with a random status, CreatedAt, and UpdatedAt.
    /// For Acquired opportunities, UpdatedAt is always set (after CreatedAt) to simulate
    /// a realistic acquisition date.
    /// </summary>
    private static Gen<LandOpportunity> OpportunityGen()
    {
        return from status in Gen.Elements(AllStatuses)
               from createdDaysAgo in Gen.Choose(10, 365)
               from cycleDays in Gen.Choose(1, createdDaysAgo - 1)
               select new LandOpportunity
               {
                   Id = Guid.NewGuid(),
                   Name = $"Opportunity-{Guid.NewGuid():N}",
                   Location = "Test Location",
                   LandSize = 1.0m,
                   Status = status,
                   CreatedAt = DateTime.UtcNow.AddDays(-createdDaysAgo),
                   UpdatedAt = status == OpportunityStatus.Acquired
                       ? DateTime.UtcNow.AddDays(-createdDaysAgo).AddDays(cycleDays)
                       : (cycleDays > 0 ? DateTime.UtcNow.AddDays(-createdDaysAgo).AddDays(cycleDays) : null)
               };
    }

    /// <summary>
    /// Generates a random DueDiligence entity with a random status.
    /// </summary>
    private static Gen<DueDiligenceEntity> DueDiligenceGen()
    {
        return from status in Gen.Elements(AllDdStatuses)
               from type in Gen.Elements(Enum.GetValues<DueDiligenceType>())
               select new DueDiligenceEntity
               {
                   Id = Guid.NewGuid(),
                   OpportunityId = Guid.NewGuid(),
                   Type = type,
                   Status = status,
                   CreatedAt = DateTime.UtcNow.AddDays(-30)
               };
    }

    /// <summary>
    /// Property 11a: OpportunitiesByStatus correctness.
    /// For any random set of N opportunities with random statuses, the grouped counts
    /// returned by the handler SHALL match the actual counts per status.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property OpportunitiesByStatus_MatchesExpectedGroupedCounts()
    {
        var arb = Arb.From(Gen.ListOf(OpportunityGen()).Select(fs => fs.ToList()));

        return Prop.ForAll(arb, (List<LandOpportunity> opportunities) =>
        {
            var handler = CreateHandler(opportunities.ToList(), new List<DueDiligenceEntity>());
            var result = handler.Handle(new GetDashboardMetricsQuery(), CancellationToken.None)
                .GetAwaiter().GetResult();

            // Compute expected grouped counts
            var expectedGroups = opportunities
                .GroupBy(o => o.Status)
                .ToDictionary(g => g.Key.ToString(), g => g.Count());

            // Every status returned should match expected count
            foreach (var kvp in result.OpportunitiesByStatus)
            {
                expectedGroups.Should().ContainKey(kvp.Key);
                kvp.Value.Should().Be(expectedGroups[kvp.Key],
                    because: $"count for status {kvp.Key} should match the actual count");
            }

            // No expected status group should be missing from result
            foreach (var kvp in expectedGroups)
            {
                result.OpportunitiesByStatus.Should().ContainKey(kvp.Key);
                result.OpportunitiesByStatus[kvp.Key].Should().Be(kvp.Value);
            }
        });
    }

    /// <summary>
    /// Property 11b: ConversionRatePercent correctness.
    /// For any dataset, ConversionRatePercent == (Acquired count / total count) * 100.
    /// When total count is 0, ConversionRatePercent == 0.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ConversionRate_MatchesFormula()
    {
        var arb = Arb.From(Gen.ListOf(OpportunityGen()).Select(fs => fs.ToList()));

        return Prop.ForAll(arb, (List<LandOpportunity> opportunities) =>
        {
            var handler = CreateHandler(opportunities.ToList(), new List<DueDiligenceEntity>());
            var result = handler.Handle(new GetDashboardMetricsQuery(), CancellationToken.None)
                .GetAwaiter().GetResult();

            var totalCount = opportunities.Count;
            var acquiredCount = opportunities.Count(o => o.Status == OpportunityStatus.Acquired);

            var expectedRate = totalCount > 0
                ? Math.Round((double)acquiredCount / totalCount * 100.0, 2)
                : 0.0;

            result.ConversionRatePercent.Should().Be(expectedRate,
                because: "ConversionRate = (Acquired / Total) * 100");
        });
    }

    /// <summary>
    /// Property 11c: DueDiligencePassRate correctness.
    /// For any DD dataset, PassRate == (Completed count / total DD count) * 100.
    /// When total DD count is 0, PassRate == 0.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DueDiligencePassRate_MatchesFormula()
    {
        var arb = Arb.From(Gen.ListOf(DueDiligenceGen()).Select(fs => fs.ToList()));

        return Prop.ForAll(arb, (List<DueDiligenceEntity> dueDiligences) =>
        {
            var handler = CreateHandler(new List<LandOpportunity>(), dueDiligences.ToList());
            var result = handler.Handle(new GetDashboardMetricsQuery(), CancellationToken.None)
                .GetAwaiter().GetResult();

            var totalDdCount = dueDiligences.Count;
            var completedCount = dueDiligences.Count(dd => dd.Status == DueDiligenceStatus.Completed);

            var expectedRate = totalDdCount > 0
                ? Math.Round((double)completedCount / totalDdCount * 100.0, 2)
                : 0.0;

            result.DueDiligencePassRatePercent.Should().Be(expectedRate,
                because: "DDPassRate = (Completed / Total DD) * 100");
        });
    }

    /// <summary>
    /// Property 11d: TotalEvaluated correctness.
    /// TotalEvaluated == count of opportunities where Status != Identified.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TotalEvaluated_CountsOpportunitiesBeyondIdentified()
    {
        var arb = Arb.From(Gen.ListOf(OpportunityGen()).Select(fs => fs.ToList()));

        return Prop.ForAll(arb, (List<LandOpportunity> opportunities) =>
        {
            var handler = CreateHandler(opportunities.ToList(), new List<DueDiligenceEntity>());
            var result = handler.Handle(new GetDashboardMetricsQuery(), CancellationToken.None)
                .GetAwaiter().GetResult();

            var expectedEvaluated = opportunities.Count(o => o.Status != OpportunityStatus.Identified);

            result.TotalEvaluated.Should().Be(expectedEvaluated,
                because: "TotalEvaluated counts all opportunities beyond Identified status");
        });
    }

    /// <summary>
    /// Property 11e: AverageAcquisitionCycleDays correctness.
    /// For acquired opportunities with UpdatedAt set, verify the handler computes
    /// the average of (UpdatedAt - CreatedAt).TotalDays correctly.
    /// When no acquired opportunities exist, the value should be 0.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AverageAcquisitionCycle_MatchesFormula()
    {
        var arb = Arb.From(Gen.ListOf(OpportunityGen()).Select(fs => fs.ToList()));

        return Prop.ForAll(arb, (List<LandOpportunity> opportunities) =>
        {
            var handler = CreateHandler(opportunities.ToList(), new List<DueDiligenceEntity>());
            var result = handler.Handle(new GetDashboardMetricsQuery(), CancellationToken.None)
                .GetAwaiter().GetResult();

            var acquiredWithUpdatedAt = opportunities
                .Where(o => o.Status == OpportunityStatus.Acquired && o.UpdatedAt != null)
                .ToList();

            var expectedAvg = acquiredWithUpdatedAt.Count > 0
                ? Math.Round(acquiredWithUpdatedAt.Average(o => (o.UpdatedAt!.Value - o.CreatedAt).TotalDays), 2)
                : 0.0;

            result.AverageAcquisitionCycleDays.Should().Be(expectedAvg,
                because: "AverageAcquisitionCycle = AVG(UpdatedAt - CreatedAt).TotalDays for acquired opportunities");
        });
    }
}
