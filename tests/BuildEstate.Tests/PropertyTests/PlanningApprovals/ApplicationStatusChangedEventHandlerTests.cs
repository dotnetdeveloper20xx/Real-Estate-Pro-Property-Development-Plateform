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
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<ILogger<ApplicationStatusChangedEventHandler>> _loggerMock;
    private readonly ApplicationStatusChangedEventHandler _handler;

    public ApplicationStatusChangedEventHandlerTests()
    {
        _notificationServiceMock = new Mock<INotificationService>();
        _loggerMock = new Mock<ILogger<ApplicationStatusChangedEventHandler>>();

        _notificationServiceMock
            .Setup(n => n.SendToRoleAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _handler = new ApplicationStatusChangedEventHandler(
            _notificationServiceMock.Object,
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
                var notificationMock = new Mock<INotificationService>();
                notificationMock
                    .Setup(n => n.SendToRoleAsync(
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<Guid?>(),
                        It.IsAny<CancellationToken>()))
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
                    n => n.SendToRoleAsync(
                        "PlanningManager",
                        "ApplicationStatusChanged",
                        It.IsAny<string>(),
                        domainEvent.ApplicationId,
                        It.IsAny<CancellationToken>()),
                    Times.Once);

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
                var notificationMock = new Mock<INotificationService>();
                notificationMock
                    .Setup(n => n.SendToRoleAsync(
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<Guid?>(),
                        It.IsAny<CancellationToken>()))
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
                    n => n.SendToRoleAsync(
                        "AcquisitionManager",
                        "ApplicationStatusChanged",
                        It.IsAny<string>(),
                        domainEvent.ApplicationId,
                        It.IsAny<CancellationToken>()),
                    Times.Once);

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
                var notificationMock = new Mock<INotificationService>();
                notificationMock
                    .Setup(n => n.SendToRoleAsync(
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<Guid?>(),
                        It.IsAny<CancellationToken>()))
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
                    n => n.SendToRoleAsync(
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<Guid?>(),
                        It.IsAny<CancellationToken>()),
                    Times.Never);

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
        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync("PlanningManager", "ApplicationStatusChanged",
                It.Is<string>(m => m.Contains("Approved")),
                domainEvent.ApplicationId, It.IsAny<CancellationToken>()),
            Times.Once);

        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync("AcquisitionManager", "ApplicationStatusChanged",
                It.Is<string>(m => m.Contains("Approved")),
                domainEvent.ApplicationId, It.IsAny<CancellationToken>()),
            Times.Once);
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
        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync("PlanningManager", "ApplicationStatusChanged",
                It.Is<string>(m => m.Contains("Refused")),
                domainEvent.ApplicationId, It.IsAny<CancellationToken>()),
            Times.Once);

        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync("AcquisitionManager", "ApplicationStatusChanged",
                It.Is<string>(m => m.Contains("Refused")),
                domainEvent.ApplicationId, It.IsAny<CancellationToken>()),
            Times.Once);
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
        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
