using BuildEstate.Application.Features.PlanningApprovals.Dashboard.Queries.GetDashboardMetrics;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for KPI calculations in the GetDashboardMetricsQueryHandler,
/// specifically validating Approval Rate and Appeal Success Rate formulas.
///
/// **Validates: Requirements 11.3, 11.4**
/// </summary>
public class KpiCalculationPropertyTests
{
    #region Property 16: Approval Rate Calculation

    /// <summary>
    /// Property 16: Approval Rate Calculation
    ///
    /// For any set of PlanningApplications with final decisions, the Approval Rate SHALL equal
    /// (count of Approved + count of ApprovedWithConditions) / (count of Approved + ApprovedWithConditions + Refused) * 100.
    /// Applications with non-final statuses do not affect the rate.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ApprovalRate_EqualsPercentageOfApprovedOutOfAllDecided()
    {
        var applicationListGen = GenerateApplicationList();

        return Prop.ForAll(
            applicationListGen.ToArbitrary(),
            applications =>
            {
                // Arrange
                var handler = CreateHandler(applications, new List<PlanningAppeal>());
                var query = new GetDashboardMetricsQuery();

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert — compute expected approval rate from the raw list
                var approvedCount = applications.Count(a =>
                    a.Status == PlanningApplicationStatus.Approved ||
                    a.Status == PlanningApplicationStatus.ApprovedWithConditions);

                var refusedCount = applications.Count(a =>
                    a.Status == PlanningApplicationStatus.Refused);

                var totalDecided = approvedCount + refusedCount;

                double expectedRate = totalDecided == 0
                    ? 0
                    : Math.Round((double)approvedCount / totalDecided * 100, 1);

                result.ApprovalRatePercent.Should().Be(expectedRate,
                    $"ApprovalRate should be ({approvedCount} / {totalDecided}) * 100 = {expectedRate}%");

                return true;
            });
    }

    /// <summary>
    /// Property 16: Approval Rate Calculation — Zero Decided Applications
    ///
    /// When no applications have a final decision (Approved, ApprovedWithConditions, or Refused),
    /// the Approval Rate SHALL be 0.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ApprovalRate_IsZero_WhenNoDecidedApplicationsExist()
    {
        // Generate applications with only non-final statuses
        var nonFinalStatusGen = Gen.Elements(
            PlanningApplicationStatus.PreApplication,
            PlanningApplicationStatus.Submitted,
            PlanningApplicationStatus.Validated,
            PlanningApplicationStatus.UnderReview,
            PlanningApplicationStatus.CommitteeReview,
            PlanningApplicationStatus.Appeal,
            PlanningApplicationStatus.Withdrawn);

        var applicationListGen = Gen.Choose(0, 15).SelectMany(count =>
            Gen.ListOf(count, GenerateSingleApplication(nonFinalStatusGen))
                .Select(l => l.ToList()));

        return Prop.ForAll(
            applicationListGen.ToArbitrary(),
            applications =>
            {
                // Arrange
                var handler = CreateHandler(applications, new List<PlanningAppeal>());
                var query = new GetDashboardMetricsQuery();

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.ApprovalRatePercent.Should().Be(0,
                    "ApprovalRate should be 0 when no decided applications exist");

                return true;
            });
    }

    /// <summary>
    /// Property 16: Approval Rate Calculation — All Approved Gives 100%
    ///
    /// When all decided applications are Approved or ApprovedWithConditions (none Refused),
    /// the Approval Rate SHALL be 100.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ApprovalRate_Is100_WhenAllDecidedApplicationsAreApproved()
    {
        var approvedStatusGen = Gen.Elements(
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions);

        var applicationListGen = Gen.Choose(1, 20).SelectMany(count =>
            Gen.ListOf(count, GenerateSingleApplication(approvedStatusGen))
                .Select(l => l.ToList()));

        return Prop.ForAll(
            applicationListGen.ToArbitrary(),
            applications =>
            {
                // Arrange
                var handler = CreateHandler(applications, new List<PlanningAppeal>());
                var query = new GetDashboardMetricsQuery();

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.ApprovalRatePercent.Should().Be(100,
                    "ApprovalRate should be 100% when all decided applications are Approved");

                return true;
            });
    }

    #endregion

    #region Property 17: Appeal Success Rate Calculation

    /// <summary>
    /// Property 17: Appeal Success Rate Calculation
    ///
    /// For any set of PlanningAppeals with final decisions, the Appeal Success Rate SHALL equal
    /// (count of Allowed) / (count of Allowed + Dismissed) * 100.
    /// Appeals with non-final statuses do not affect the rate.
    ///
    /// **Validates: Requirements 11.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AppealSuccessRate_EqualsPercentageOfAllowedOutOfAllDecided()
    {
        var appealListGen = GenerateAppealList();

        return Prop.ForAll(
            appealListGen.ToArbitrary(),
            appeals =>
            {
                // Arrange
                var handler = CreateHandler(new List<PlanningApplication>(), appeals);
                var query = new GetDashboardMetricsQuery();

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert — compute expected appeal success rate from the raw list
                var allowedCount = appeals.Count(a => a.Status == AppealStatus.Allowed);
                var dismissedCount = appeals.Count(a => a.Status == AppealStatus.Dismissed);
                var totalDecided = allowedCount + dismissedCount;

                double expectedRate = totalDecided == 0
                    ? 0
                    : Math.Round((double)allowedCount / totalDecided * 100, 1);

                result.AppealSuccessRatePercent.Should().Be(expectedRate,
                    $"AppealSuccessRate should be ({allowedCount} / {totalDecided}) * 100 = {expectedRate}%");

                return true;
            });
    }

    /// <summary>
    /// Property 17: Appeal Success Rate Calculation — Zero Decided Appeals
    ///
    /// When no appeals have a final decision (Allowed or Dismissed),
    /// the Appeal Success Rate SHALL be 0.
    ///
    /// **Validates: Requirements 11.4**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AppealSuccessRate_IsZero_WhenNoDecidedAppealsExist()
    {
        // Generate appeals with only non-final statuses
        var nonFinalStatusGen = Gen.Elements(
            AppealStatus.Lodged,
            AppealStatus.UnderReview,
            AppealStatus.HearingScheduled,
            AppealStatus.Closed);

        var appealListGen = Gen.Choose(0, 15).SelectMany(count =>
            Gen.ListOf(count, GenerateSingleAppeal(nonFinalStatusGen))
                .Select(l => l.ToList()));

        return Prop.ForAll(
            appealListGen.ToArbitrary(),
            appeals =>
            {
                // Arrange
                var handler = CreateHandler(new List<PlanningApplication>(), appeals);
                var query = new GetDashboardMetricsQuery();

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.AppealSuccessRatePercent.Should().Be(0,
                    "AppealSuccessRate should be 0 when no decided appeals exist");

                return true;
            });
    }

    /// <summary>
    /// Property 17: Appeal Success Rate Calculation — All Allowed Gives 100%
    ///
    /// When all decided appeals are Allowed (none Dismissed),
    /// the Appeal Success Rate SHALL be 100.
    ///
    /// **Validates: Requirements 11.4**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AppealSuccessRate_Is100_WhenAllDecidedAppealsAreAllowed()
    {
        var appealListGen = Gen.Choose(1, 20).SelectMany(count =>
            Gen.ListOf(count, GenerateSingleAppeal(Gen.Constant(AppealStatus.Allowed)))
                .Select(l => l.ToList()));

        return Prop.ForAll(
            appealListGen.ToArbitrary(),
            appeals =>
            {
                // Arrange
                var handler = CreateHandler(new List<PlanningApplication>(), appeals);
                var query = new GetDashboardMetricsQuery();

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.AppealSuccessRatePercent.Should().Be(100,
                    "AppealSuccessRate should be 100% when all decided appeals are Allowed");

                return true;
            });
    }

    #endregion

    #region Generators

    /// <summary>
    /// Generates a list of PlanningApplication entities with random statuses
    /// (mix of final and non-final statuses) to test the approval rate calculation.
    /// </summary>
    private static Gen<List<PlanningApplication>> GenerateApplicationList()
    {
        var allStatusGen = Gen.Elements(
            PlanningApplicationStatus.PreApplication,
            PlanningApplicationStatus.Submitted,
            PlanningApplicationStatus.Validated,
            PlanningApplicationStatus.UnderReview,
            PlanningApplicationStatus.CommitteeReview,
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions,
            PlanningApplicationStatus.Refused,
            PlanningApplicationStatus.Appeal,
            PlanningApplicationStatus.Withdrawn);

        return Gen.Choose(1, 25).SelectMany(count =>
            Gen.ListOf(count, GenerateSingleApplication(allStatusGen))
                .Select(l => l.ToList()));
    }

    /// <summary>
    /// Generates a single PlanningApplication with a status from the provided generator.
    /// </summary>
    private static Gen<PlanningApplication> GenerateSingleApplication(Gen<PlanningApplicationStatus> statusGen)
    {
        return from status in statusGen
               select new PlanningApplication
               {
                   Id = Guid.NewGuid(),
                   OpportunityId = Guid.NewGuid(),
                   Description = "Generated test application",
                   ApplicationType = PlanningApplicationType.Full,
                   Status = status,
                   CouncilName = "Test Council",
                   CreatedAt = DateTime.UtcNow.AddDays(-30),
                   CreatedBy = "test-user"
               };
    }

    /// <summary>
    /// Generates a list of PlanningAppeal entities with random statuses
    /// (mix of final and non-final statuses) to test the appeal success rate calculation.
    /// </summary>
    private static Gen<List<PlanningAppeal>> GenerateAppealList()
    {
        var allStatusGen = Gen.Elements(
            AppealStatus.Lodged,
            AppealStatus.UnderReview,
            AppealStatus.HearingScheduled,
            AppealStatus.Allowed,
            AppealStatus.Dismissed,
            AppealStatus.Closed);

        return Gen.Choose(1, 25).SelectMany(count =>
            Gen.ListOf(count, GenerateSingleAppeal(allStatusGen))
                .Select(l => l.ToList()));
    }

    /// <summary>
    /// Generates a single PlanningAppeal with a status from the provided generator.
    /// </summary>
    private static Gen<PlanningAppeal> GenerateSingleAppeal(Gen<AppealStatus> statusGen)
    {
        return from status in statusGen
               select new PlanningAppeal
               {
                   Id = Guid.NewGuid(),
                   ApplicationId = Guid.NewGuid(),
                   AppealGrounds = "Generated appeal grounds for property testing purposes - minimum length",
                   AppealType = AppealType.WrittenRepresentations,
                   Status = status,
                   LodgedDate = DateTime.UtcNow.AddDays(-14),
                   CreatedAt = DateTime.UtcNow.AddDays(-14),
                   CreatedBy = "test-user"
               };
    }

    #endregion

    #region Test Helpers

    /// <summary>
    /// Creates a GetDashboardMetricsQueryHandler with mocked repositories populated
    /// with the provided application and appeal data. Other dependencies are mocked
    /// to return empty/default results since we're only testing KPI calculations.
    /// </summary>
    private static GetDashboardMetricsQueryHandler CreateHandler(
        List<PlanningApplication> applications,
        List<PlanningAppeal> appeals)
    {
        var applicationRepoMock = new Mock<IRepository<PlanningApplication>>();
        applicationRepoMock
            .Setup(r => r.Query())
            .Returns(applications.AsAsyncQueryable());

        var conditionRepoMock = new Mock<IRepository<PlanningCondition>>();
        conditionRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningCondition>().AsAsyncQueryable());

        var milestoneRepoMock = new Mock<IRepository<PlanningMilestone>>();
        milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone>().AsAsyncQueryable());

        var appealRepoMock = new Mock<IRepository<PlanningAppeal>>();
        appealRepoMock
            .Setup(r => r.Query())
            .Returns(appeals.AsAsyncQueryable());

        var auditLogServiceMock = new Mock<IAuditLogQueryService>();
        auditLogServiceMock
            .Setup(s => s.GetRecentChangesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AuditEntryDto>());

        return new GetDashboardMetricsQueryHandler(
            applicationRepoMock.Object,
            conditionRepoMock.Object,
            milestoneRepoMock.Object,
            appealRepoMock.Object,
            auditLogServiceMock.Object);
    }

    #endregion
}
