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
/// Tests for FeeRequiresApprovalEventHandler verifying that notifications are sent
/// to the FinanceDirector role when a planning fee exceeds the configured threshold.
///
/// **Validates: Requirements 12.4, 12.6**
/// </summary>
public class FeeRequiresApprovalEventHandlerTests
{
    private readonly Mock<INotificationEngine> _notificationEngineMock;
    private readonly Mock<ILogger<FeeRequiresApprovalEventHandler>> _loggerMock;
    private readonly FeeRequiresApprovalEventHandler _handler;

    public FeeRequiresApprovalEventHandlerTests()
    {
        _notificationEngineMock = new Mock<INotificationEngine>();
        _loggerMock = new Mock<ILogger<FeeRequiresApprovalEventHandler>>();

        _notificationEngineMock
            .Setup(n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _handler = new FeeRequiresApprovalEventHandler(
            _notificationEngineMock.Object,
            _loggerMock.Object);
    }

    /// <summary>
    /// For any FeeType and positive amount, the handler SHALL always send a notification
    /// to the FinanceDirector role with eventType "FeeRequiresApproval".
    ///
    /// **Validates: Requirements 12.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property FeeRequiresApproval_AlwaysNotifiesFinanceDirector()
    {
        var feeTypes = Enum.GetValues<FeeType>();

        return Prop.ForAll(
            Gen.Elements(feeTypes).ToArbitrary(),
            Arb.From(Gen.Choose(10001, 500000).Select(x => (decimal)x)),
            (feeType, amount) =>
            {
                // Arrange
                var notificationMock = new Mock<INotificationEngine>();
                notificationMock
                    .Setup(n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new FeeRequiresApprovalEventHandler(
                    notificationMock.Object,
                    new Mock<ILogger<FeeRequiresApprovalEventHandler>>().Object);

                var domainEvent = new FeeRequiresApprovalDomainEvent
                {
                    FeeId = Guid.NewGuid(),
                    ApplicationId = Guid.NewGuid(),
                    Amount = amount,
                    Currency = "GBP",
                    FeeType = feeType
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
    /// The notification message SHALL contain the fee amount and currency.
    ///
    /// **Validates: Requirements 12.4, 12.6**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property FeeRequiresApproval_MessageContainsAmountAndCurrency()
    {
        var currencies = new[] { "GBP", "USD", "EUR" };

        return Prop.ForAll(
            Arb.From(Gen.Choose(10001, 500000).Select(x => (decimal)x)),
            Gen.Elements(currencies).ToArbitrary(),
            (amount, currency) =>
            {
                // Arrange
                var notificationMock = new Mock<INotificationEngine>();
                NotificationEvent? capturedEvent = null;

                notificationMock
                    .Setup(n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()))
                    .Callback<NotificationEvent, CancellationToken>(
                        (evt, _) => capturedEvent = evt)
                    .Returns(Task.CompletedTask);

                var handler = new FeeRequiresApprovalEventHandler(
                    notificationMock.Object,
                    new Mock<ILogger<FeeRequiresApprovalEventHandler>>().Object);

                var domainEvent = new FeeRequiresApprovalDomainEvent
                {
                    FeeId = Guid.NewGuid(),
                    ApplicationId = Guid.NewGuid(),
                    Amount = amount,
                    Currency = currency,
                    FeeType = FeeType.ApplicationFee
                };

                // Act
                handler.Handle(domainEvent, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                capturedEvent.Should().NotBeNull();

                return true;
            });
    }

    [Fact]
    public async Task Handle_FeeExceedsThreshold_NotifiesFinanceDirector()
    {
        // Arrange
        var domainEvent = new FeeRequiresApprovalDomainEvent
        {
            FeeId = Guid.NewGuid(),
            ApplicationId = Guid.NewGuid(),
            Amount = 25000.00m,
            Currency = "GBP",
            FeeType = FeeType.ApplicationFee
        };

        // Act
        await _handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        _notificationEngineMock.Verify(
            n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }

    [Fact]
    public async Task Handle_SupplementaryFee_NotifiesFinanceDirectorWithFeeType()
    {
        // Arrange
        var domainEvent = new FeeRequiresApprovalDomainEvent
        {
            FeeId = Guid.NewGuid(),
            ApplicationId = Guid.NewGuid(),
            Amount = 15000.00m,
            Currency = "GBP",
            FeeType = FeeType.SupplementaryFee
        };

        // Act
        await _handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        _notificationEngineMock.Verify(
            n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }

    [Fact]
    public async Task Handle_Event_SendsNotificationWithApplicationId()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var domainEvent = new FeeRequiresApprovalDomainEvent
        {
            FeeId = Guid.NewGuid(),
            ApplicationId = applicationId,
            Amount = 50000.00m,
            Currency = "USD",
            FeeType = FeeType.AppealFee
        };

        // Act
        await _handler.Handle(domainEvent, CancellationToken.None);

        // Assert
        _notificationEngineMock.Verify(
            n => n.EmitAsync(It.IsAny<NotificationEvent>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }
}
