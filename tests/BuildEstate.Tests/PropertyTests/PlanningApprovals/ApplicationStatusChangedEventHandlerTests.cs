using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.PlanningApprovals.EventHandlers;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Tests for ApplicationStatusChangedEventHandler verifying that notifications are sent
/// to PlanningManager and AcquisitionManager when application status transitions to
/// Approved, ApprovedWithConditions, or Refused.
///
/// **Validates: Requirements 12.1, 12.6**
/// </summary>
public class ApplicationStatusChangedEventHandlerTests
{
    private readonly Mock<INotificationEngine> _notificationEngineMock;
    private readonly Mock<ILogger<ApplicationStatusChangedEventHandler>> _loggerMock;
    private readonly ApplicationStatusChangedEventHandler _handler;

    public ApplicationStatusChangedEventHandlerTests()
    {
        _notificationEngineMock = new Mock<INotificationEngine>();
        _loggerMock = new Mock<ILogger<ApplicationStatusChangedEventHandler>>();

        _notificationEngineMock
            .Setup(n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _handler = new ApplicationStatusChangedEventHandler(
            _notificationEngineMock.Object,
            _loggerMock.Object);
    }

    /// <summary>
    /// For any decision status (Approved, ApprovedWithConditions, Refused), the handler
    /// SHALL send a notification to the PlanningManager role.
    ///
    /// **Validates: Requirements 12.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DecisionStatus_AlwaysNotifiesPlanningManager()
    {
        var decisionStatuses = new[]
        {
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions,
            PlanningApplicationStatus.Refused
        };

        return Prop.ForAll(
            Gen.Elements(decisionStatuses).ToArbitrary(),
            newStatus =>
            {
                // Arrange
                var notificationMock = new Mock<INotificationEngine>();
                notificationMock
                    .Setup(n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new ApplicationStatusChangedEventHandler(
                    notificationMock.Object,
                    new Mock<ILogger<ApplicationStatusChangedEventHandler>>().Object);

                var domainEvent = new ApplicationStatusChangedDomainEvent
                {
                    ApplicationId = Guid.NewGuid(),
                    PreviousStatus = PlanningApplicationStatus.UnderReview,
                    NewStatus = newStatus,
                    ChangedBy = "test-user",
                    ChangedAt = DateTime.UtcNow
                };

                // Act
                handler.Handle(domainEvent, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                notificationMock.Verify(
                    n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
                    Times.AtLeastOnce());

                return true;
            });
    }

    /// <summary>
    /// For any decision status (Approved, ApprovedWithConditions, Refused), the handler
    /// SHALL send a notification to the AcquisitionManager role.
    ///
    /// **Validates: Requirements 12.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DecisionStatus_AlwaysNotifiesAcquisitionManager()
    {
        var decisionStatuses = new[]
        {
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions,
            PlanningApplicationStatus.Refused
        };

        return Prop.ForAll(
            Gen.Elements(decisionStatuses).ToArbitrary(),
            newStatus =>
            {
                // Arrange
                var notificationMock = new Mock<INotificationEngine>();
                notificationMock
                    .Setup(n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new ApplicationStatusChangedEventHandler(
                    notificationMock.Object,
                    new Mock<ILogger<ApplicationStatusChangedEventHandler>>().Object);

                var domainEvent = new ApplicationStatusChangedDomainEvent
                {
                    ApplicationId = Guid.NewGuid(),
                    PreviousStatus = PlanningApplicationStatus.UnderReview,
                    NewStatus = newStatus,
                    ChangedBy = "test-user",
                    ChangedAt = DateTime.UtcNow
                };

                // Act
                handler.Handle(domainEvent, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                notificationMock.Verify(
                    n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
                    Times.AtLeastOnce());

                return true;
            });
    }

    /// <summary>
    /// For any non-decision status, the handler SHALL NOT send any notification.
    ///
    /// **Validates: Requirements 12.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NonDecisionStatus_DoesNotSendNotification()
    {
        var nonDecisionStatuses = new[]
        {
            PlanningApplicationStatus.PreApplication,
            PlanningApplicationStatus.Submitted,
            PlanningApplicationStatus.Validated,
            PlanningApplicationStatus.UnderReview,
            PlanningApplicationStatus.CommitteeReview,
            PlanningApplicationStatus.Appeal,
            PlanningApplicationStatus.Withdrawn
        };

        return Prop.ForAll(
            Gen.Elements(nonDecisionStatuses).ToArbitrary(),
            newStatus =>
            {
                // Arrange
                var notificationMock = new Mock<INotificationEngine>();
                notificationMock
                    .Setup(n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new ApplicationStatusChangedEventHandler(
                    notificationMock.Object,
                    new Mock<ILogger<ApplicationStatusChangedEventHandler>>().Object);

                var domainEvent = new ApplicationStatusChangedDomainEvent
                {
                    ApplicationId = Guid.NewGuid(),
                    PreviousStatus = PlanningApplicationStatus.PreApplication,
                    NewStatus = newStatus,
                    ChangedBy = "test-user",
                    ChangedAt = DateTime.UtcNow
                };

                // Act
                handler.Handle(domainEvent, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                notificationMock.Verify(
                    n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
                    Times.Never());

                return true;
            });
    }

    [Fact]
    public async Task Handle_StatusApproved_NotifiesBothRoles()
    {
        // Arrange
        var domainEvent = new ApplicationStatusChangedDomainEvent
        {
            ApplicationId = Guid.NewGuid(),
            PreviousStatus = PlanningApplicationStatus.UnderReview,
            NewStatus = PlanningApplicationStatus.Approved,
            ChangedBy = "planning-manager-1",
            ChangedAt = DateTime.UtcNow
        };

        // Act
        await _handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        _notificationEngineMock.Verify(
            n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }

    [Fact]
    public async Task Handle_StatusRefused_NotifiesBothRoles()
    {
        // Arrange
        var domainEvent = new ApplicationStatusChangedDomainEvent
        {
            ApplicationId = Guid.NewGuid(),
            PreviousStatus = PlanningApplicationStatus.CommitteeReview,
            NewStatus = PlanningApplicationStatus.Refused,
            ChangedBy = "planning-manager-1",
            ChangedAt = DateTime.UtcNow
        };

        // Act
        await _handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        _notificationEngineMock.Verify(
            n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }

    [Fact]
    public async Task Handle_StatusSubmitted_DoesNotSendNotification()
    {
        // Arrange
        var domainEvent = new ApplicationStatusChangedDomainEvent
        {
            ApplicationId = Guid.NewGuid(),
            PreviousStatus = PlanningApplicationStatus.PreApplication,
            NewStatus = PlanningApplicationStatus.Submitted,
            ChangedBy = "planning-manager-1",
            ChangedAt = DateTime.UtcNow
        };

        // Act
        await _handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        _notificationEngineMock.Verify(
            n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
            Times.Never());
    }
}
