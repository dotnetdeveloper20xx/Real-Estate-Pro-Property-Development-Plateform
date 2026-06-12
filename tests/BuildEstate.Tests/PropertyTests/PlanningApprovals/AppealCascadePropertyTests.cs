using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.PlanningApprovals.EventHandlers;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for the AppealAllowedEventHandler verifying that when a
/// PlanningAppeal is allowed, the parent PlanningApplication status transitions
/// correctly based on the AppealOutcomeType.
///
/// Property 11: Appeal Allowed Cascades to Parent Application Status
/// - AppealOutcomeType.Approved → parent status = Approved
/// - AppealOutcomeType.ApprovedWithConditions → parent status = ApprovedWithConditions
///
/// **Validates: Requirements 6.6**
/// </summary>
public class AppealCascadePropertyTests
{
    /// <summary>
    /// Property 11: For any PlanningAppeal that transitions to Allowed with a random
    /// AppealOutcomeType, the parent PlanningApplication status SHALL transition to the
    /// corresponding PlanningApplicationStatus.
    ///
    /// - AppealOutcomeType.Approved → PlanningApplicationStatus.Approved
    /// - AppealOutcomeType.ApprovedWithConditions → PlanningApplicationStatus.ApprovedWithConditions
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AppealAllowed_CascadesToCorrectParentApplicationStatus()
    {
        var outcomeTypes = Enum.GetValues<AppealOutcomeType>();

        return Prop.ForAll(
            Gen.Elements(outcomeTypes).ToArbitrary(),
            outcomeType =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var appealId = Guid.NewGuid();

                var application = new PlanningApplication
                {
                    Id = applicationId,
                    OpportunityId = Guid.NewGuid(),
                    Description = "Test application for appeal cascade",
                    ApplicationType = PlanningApplicationType.Full,
                    Status = PlanningApplicationStatus.Appeal,
                    CouncilName = "Test Council",
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    CreatedBy = "test-user"
                };

                var handler = CreateHandler(application);

                var domainEvent = new AppealAllowedDomainEvent
                {
                    AppealId = appealId,
                    ApplicationId = applicationId,
                    OutcomeType = outcomeType,
                    DecisionDate = DateTime.UtcNow,
                    DecisionSummary = "Appeal allowed by inspector with conditions"
                };

                // Act
                handler.Handle(domainEvent, CancellationToken.None).GetAwaiter().GetResult();

                // Assert — verify the correct status transition
                var expectedStatus = outcomeType switch
                {
                    AppealOutcomeType.Approved => PlanningApplicationStatus.Approved,
                    AppealOutcomeType.ApprovedWithConditions => PlanningApplicationStatus.ApprovedWithConditions,
                    _ => throw new InvalidOperationException($"Unexpected outcome type: {outcomeType}")
                };

                application.Status.Should().Be(expectedStatus,
                    $"when AppealOutcomeType is {outcomeType}, parent application status should be {expectedStatus}");

                return true;
            });
    }

    /// <summary>
    /// Property 11 (continued): For AppealOutcomeType.Approved specifically,
    /// the parent application SHALL transition to PlanningApplicationStatus.Approved.
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Fact]
    public async Task AppealAllowed_WithApprovedOutcome_SetsParentStatusToApproved()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var application = CreateTestApplication(applicationId);
        var handler = CreateHandler(application);

        var domainEvent = new AppealAllowedDomainEvent
        {
            AppealId = Guid.NewGuid(),
            ApplicationId = applicationId,
            OutcomeType = AppealOutcomeType.Approved,
            DecisionDate = DateTime.UtcNow,
            DecisionSummary = "Appeal allowed - full approval granted"
        };

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        application.Status.Should().Be(PlanningApplicationStatus.Approved);
        application.DecisionDate.Should().Be(domainEvent.DecisionDate);
    }

    /// <summary>
    /// Property 11 (continued): For AppealOutcomeType.ApprovedWithConditions specifically,
    /// the parent application SHALL transition to PlanningApplicationStatus.ApprovedWithConditions.
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Fact]
    public async Task AppealAllowed_WithApprovedWithConditionsOutcome_SetsParentStatusToApprovedWithConditions()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var application = CreateTestApplication(applicationId);
        var handler = CreateHandler(application);

        var domainEvent = new AppealAllowedDomainEvent
        {
            AppealId = Guid.NewGuid(),
            ApplicationId = applicationId,
            OutcomeType = AppealOutcomeType.ApprovedWithConditions,
            DecisionDate = DateTime.UtcNow,
            DecisionSummary = "Appeal allowed with conditions imposed by inspector"
        };

        // Act
        await handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        application.Status.Should().Be(PlanningApplicationStatus.ApprovedWithConditions);
        application.DecisionDate.Should().Be(domainEvent.DecisionDate);
    }

    /// <summary>
    /// Property 11 (continued): The handler SHALL update the application's UpdatedAt
    /// timestamp when cascading the status change.
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AppealAllowed_AlwaysUpdatesTimestamp()
    {
        var outcomeTypes = Enum.GetValues<AppealOutcomeType>();

        return Prop.ForAll(
            Gen.Elements(outcomeTypes).ToArbitrary(),
            outcomeType =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateTestApplication(applicationId);
                var beforeHandle = DateTime.UtcNow;

                var handler = CreateHandler(application);

                var domainEvent = new AppealAllowedDomainEvent
                {
                    AppealId = Guid.NewGuid(),
                    ApplicationId = applicationId,
                    OutcomeType = outcomeType,
                    DecisionDate = DateTime.UtcNow,
                    DecisionSummary = "Appeal decision summary text for testing"
                };

                // Act
                handler.Handle(domainEvent, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                application.UpdatedAt.Should().NotBeNull();
                application.UpdatedAt!.Value.Should().BeOnOrAfter(beforeHandle,
                    "UpdatedAt should be set to current UTC time when status changes");

                return true;
            });
    }

    /// <summary>
    /// Property 11 (continued): The handler SHALL call SaveChangesAsync to persist
    /// the parent status transition for any AppealOutcomeType.
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AppealAllowed_AlwaysPersistsChanges()
    {
        var outcomeTypes = Enum.GetValues<AppealOutcomeType>();

        return Prop.ForAll(
            Gen.Elements(outcomeTypes).ToArbitrary(),
            outcomeType =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateTestApplication(applicationId);

                var unitOfWorkMock = new Mock<IUnitOfWork>();
                unitOfWorkMock
                    .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(1);

                var handler = CreateHandler(application, unitOfWorkMock: unitOfWorkMock);

                var domainEvent = new AppealAllowedDomainEvent
                {
                    AppealId = Guid.NewGuid(),
                    ApplicationId = applicationId,
                    OutcomeType = outcomeType,
                    DecisionDate = DateTime.UtcNow,
                    DecisionSummary = "Appeal decision persisted correctly"
                };

                // Act
                handler.Handle(domainEvent, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                unitOfWorkMock.Verify(
                    u => u.SaveChangesAsync(It.IsAny<CancellationToken>()),
                    Times.Once,
                    "SaveChangesAsync must be called exactly once to persist the status change");

                return true;
            });
    }

    #region Test Helpers

    private static PlanningApplication CreateTestApplication(Guid applicationId)
    {
        return new PlanningApplication
        {
            Id = applicationId,
            OpportunityId = Guid.NewGuid(),
            Description = "Test Planning Application for Appeal Cascade",
            ApplicationType = PlanningApplicationType.Full,
            Status = PlanningApplicationStatus.Appeal,
            CouncilName = "Test Council",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            CreatedBy = "test-user"
        };
    }

    private static AppealAllowedEventHandler CreateHandler(
        PlanningApplication application,
        Mock<IUnitOfWork>? unitOfWorkMock = null)
    {
        var applicationRepoMock = new Mock<IRepository<PlanningApplication>>();
        unitOfWorkMock ??= new Mock<IUnitOfWork>();
        var notificationServiceMock = new Mock<INotificationService>();
        var loggerMock = new Mock<ILogger<AppealAllowedEventHandler>>();

        // Setup application repository to return the test application by Id
        applicationRepoMock
            .Setup(r => r.GetByIdAsync(application.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(application);

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        notificationServiceMock
            .Setup(n => n.SendToRoleAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new AppealAllowedEventHandler(
            applicationRepoMock.Object,
            unitOfWorkMock.Object,
            notificationServiceMock.Object,
            loggerMock.Object);
    }

    #endregion
}
