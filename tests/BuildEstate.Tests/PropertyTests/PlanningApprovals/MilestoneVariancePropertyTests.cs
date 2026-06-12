using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CompleteMilestone;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
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
/// Property-based tests for milestone variance calculation.
/// Validates that VarianceDays = (ActualDate - TargetDate).Days for any pair of dates.
/// Positive variance indicates late completion, negative indicates early.
///
/// **Validates: Requirements 9.4**
/// </summary>
public class MilestoneVariancePropertyTests
{
    #region Property 12a: Variance Equals Day Difference

    /// <summary>
    /// Property 12: Milestone Variance Calculation
    ///
    /// For any PlanningMilestone with a TargetDate and a recorded ActualDate,
    /// the VarianceDays SHALL equal the integer difference (ActualDate - TargetDate) in days.
    /// Positive variance indicates late completion, negative indicates early.
    ///
    /// **Validates: Requirements 9.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CompleteMilestone_VarianceDays_EqualsActualMinusTargetDays()
    {
        // Generate date offsets in a reasonable range to avoid overflow
        var targetDateGen = Gen.Choose(-3650, 3650)
            .Select(offset => DateTime.UtcNow.Date.AddDays(offset));

        var varianceDaysGen = Gen.Choose(-1000, 1000);

        return Prop.ForAll(
            targetDateGen.ToArbitrary(),
            varianceDaysGen.ToArbitrary(),
            (targetDate, varianceDaysDelta) =>
            {
                // Derive ActualDate from TargetDate + delta so we know the expected variance
                var actualDate = targetDate.AddDays(varianceDaysDelta);
                var expectedVariance = (actualDate - targetDate).Days;

                // Arrange
                var milestoneId = Guid.NewGuid();
                var milestone = new PlanningMilestone
                {
                    Id = milestoneId,
                    ApplicationId = Guid.NewGuid(),
                    MilestoneType = MilestoneType.TargetDecisionDate,
                    Status = MilestoneStatus.Pending,
                    TargetDate = targetDate,
                    ActualDate = null,
                    VarianceDays = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    CreatedBy = "test-user"
                };

                var handler = CreateHandler(milestone);

                var command = new CompleteMilestoneCommand
                {
                    MilestoneId = milestoneId,
                    ActualDate = actualDate
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                milestone.VarianceDays.Should().Be(expectedVariance,
                    $"VarianceDays must equal (ActualDate - TargetDate).Days = ({actualDate:d} - {targetDate:d}).Days = {expectedVariance}");
                milestone.ActualDate.Should().Be(actualDate);
                milestone.Status.Should().Be(MilestoneStatus.Completed);

                return true;
            });
    }

    #endregion

    #region Property 12b: Positive Variance Means Late Completion

    /// <summary>
    /// Property 12 (continued): When ActualDate is after TargetDate, VarianceDays SHALL be positive.
    ///
    /// **Validates: Requirements 9.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CompleteMilestone_WhenActualAfterTarget_VarianceIsPositive()
    {
        var targetDateGen = Gen.Choose(-1000, 1000)
            .Select(offset => DateTime.UtcNow.Date.AddDays(offset));

        // Generate positive day offsets (1 to 365) to ensure ActualDate > TargetDate
        var positiveDeltaGen = Gen.Choose(1, 365);

        return Prop.ForAll(
            targetDateGen.ToArbitrary(),
            positiveDeltaGen.ToArbitrary(),
            (targetDate, daysLate) =>
            {
                var actualDate = targetDate.AddDays(daysLate);

                // Arrange
                var milestoneId = Guid.NewGuid();
                var milestone = new PlanningMilestone
                {
                    Id = milestoneId,
                    ApplicationId = Guid.NewGuid(),
                    MilestoneType = MilestoneType.SubmissionDate,
                    Status = MilestoneStatus.Pending,
                    TargetDate = targetDate,
                    ActualDate = null,
                    VarianceDays = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    CreatedBy = "test-user"
                };

                var handler = CreateHandler(milestone);

                var command = new CompleteMilestoneCommand
                {
                    MilestoneId = milestoneId,
                    ActualDate = actualDate
                };

                // Act
                handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                milestone.VarianceDays.Should().BePositive(
                    "when ActualDate is after TargetDate, variance must be positive (late)");
                milestone.VarianceDays.Should().Be(daysLate);

                return true;
            });
    }

    #endregion

    #region Property 12c: Negative Variance Means Early Completion

    /// <summary>
    /// Property 12 (continued): When ActualDate is before TargetDate, VarianceDays SHALL be negative.
    ///
    /// **Validates: Requirements 9.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CompleteMilestone_WhenActualBeforeTarget_VarianceIsNegative()
    {
        var targetDateGen = Gen.Choose(-1000, 1000)
            .Select(offset => DateTime.UtcNow.Date.AddDays(offset));

        // Generate negative day offsets (-365 to -1) to ensure ActualDate < TargetDate
        var negativeDeltaGen = Gen.Choose(1, 365);

        return Prop.ForAll(
            targetDateGen.ToArbitrary(),
            negativeDeltaGen.ToArbitrary(),
            (targetDate, daysEarly) =>
            {
                var actualDate = targetDate.AddDays(-daysEarly);

                // Arrange
                var milestoneId = Guid.NewGuid();
                var milestone = new PlanningMilestone
                {
                    Id = milestoneId,
                    ApplicationId = Guid.NewGuid(),
                    MilestoneType = MilestoneType.ValidationDate,
                    Status = MilestoneStatus.Pending,
                    TargetDate = targetDate,
                    ActualDate = null,
                    VarianceDays = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    CreatedBy = "test-user"
                };

                var handler = CreateHandler(milestone);

                var command = new CompleteMilestoneCommand
                {
                    MilestoneId = milestoneId,
                    ActualDate = actualDate
                };

                // Act
                handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                milestone.VarianceDays.Should().BeNegative(
                    "when ActualDate is before TargetDate, variance must be negative (early)");
                milestone.VarianceDays.Should().Be(-daysEarly);

                return true;
            });
    }

    #endregion

    #region Property 12d: Zero Variance When Dates Are Equal

    /// <summary>
    /// Property 12 (continued): When ActualDate equals TargetDate, VarianceDays SHALL be zero.
    ///
    /// **Validates: Requirements 9.4**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property CompleteMilestone_WhenActualEqualsTarget_VarianceIsZero()
    {
        var dateGen = Gen.Choose(-1000, 1000)
            .Select(offset => DateTime.UtcNow.Date.AddDays(offset));

        return Prop.ForAll(
            dateGen.ToArbitrary(),
            date =>
            {
                // Arrange
                var milestoneId = Guid.NewGuid();
                var milestone = new PlanningMilestone
                {
                    Id = milestoneId,
                    ApplicationId = Guid.NewGuid(),
                    MilestoneType = MilestoneType.ConsultationEnd,
                    Status = MilestoneStatus.Pending,
                    TargetDate = date,
                    ActualDate = null,
                    VarianceDays = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    CreatedBy = "test-user"
                };

                var handler = CreateHandler(milestone);

                var command = new CompleteMilestoneCommand
                {
                    MilestoneId = milestoneId,
                    ActualDate = date
                };

                // Act
                handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                milestone.VarianceDays.Should().Be(0,
                    "when ActualDate equals TargetDate, variance must be exactly zero");

                return true;
            });
    }

    #endregion

    #region Test Helpers

    private static CompleteMilestoneCommandHandler CreateHandler(PlanningMilestone milestone)
    {
        var milestoneRepoMock = new Mock<IRepository<PlanningMilestone>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();

        // Setup milestone repository Query() to return the test milestone
        var milestones = new List<PlanningMilestone> { milestone };
        milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(milestones.AsAsyncQueryable());

        // Setup Update to do nothing (we verify state directly on the entity)
        milestoneRepoMock
            .Setup(r => r.Update(It.IsAny<PlanningMilestone>()));

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<MilestoneDto>(It.IsAny<PlanningMilestone>()))
            .Returns((PlanningMilestone ms) => new MilestoneDto
            {
                Id = ms.Id,
                ApplicationId = ms.ApplicationId,
                MilestoneType = ms.MilestoneType.ToString(),
                Status = ms.Status.ToString(),
                TargetDate = ms.TargetDate,
                ActualDate = ms.ActualDate,
                VarianceDays = ms.VarianceDays,
                CreatedAt = ms.CreatedAt
            });

        return new CompleteMilestoneCommandHandler(
            milestoneRepoMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object);
    }

    #endregion
}
