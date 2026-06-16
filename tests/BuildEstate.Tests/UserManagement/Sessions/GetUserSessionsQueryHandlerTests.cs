using BuildEstate.Application.Features.UserManagement.Sessions.Queries.GetUserSessions;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Moq;

namespace BuildEstate.Tests.UserManagement.Sessions;

public class GetUserSessionsQueryHandlerTests
{
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly GetUserSessionsQueryHandler _handler;

    public GetUserSessionsQueryHandlerTests()
    {
        _sessionServiceMock = new Mock<ISessionService>();
        _handler = new GetUserSessionsQueryHandler(_sessionServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ReturnsSessionsWithCorrectStatus_WhenCurrentSessionProvided()
    {
        // Arrange
        var currentSessionId = Guid.NewGuid();
        var activeSessionId = Guid.NewGuid();
        var expiredSessionId = Guid.NewGuid();

        var sessions = new List<UserSession>
        {
            new()
            {
                Id = currentSessionId,
                UserId = "user-1",
                DeviceInfo = "Mozilla/5.0",
                Browser = "Chrome",
                OperatingSystem = "Windows 10",
                IpAddress = "192.168.1.1",
                City = "London",
                Country = "UK",
                LastActiveAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            },
            new()
            {
                Id = activeSessionId,
                UserId = "user-1",
                DeviceInfo = "Mozilla/5.0",
                Browser = "Firefox",
                OperatingSystem = "macOS",
                IpAddress = "10.0.0.1",
                City = null,
                Country = null,
                LastActiveAt = DateTime.UtcNow.AddHours(-2),
                ExpiresAt = DateTime.UtcNow.AddDays(5),
                IsRevoked = false
            },
            new()
            {
                Id = expiredSessionId,
                UserId = "user-1",
                DeviceInfo = "Mozilla/5.0",
                Browser = "Safari",
                OperatingSystem = "iOS",
                IpAddress = "172.16.0.1",
                City = "New York",
                Country = "US",
                LastActiveAt = DateTime.UtcNow.AddDays(-8),
                ExpiresAt = DateTime.UtcNow.AddDays(-1),
                IsRevoked = false
            }
        };

        _sessionServiceMock
            .Setup(x => x.GetActiveSessionsAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessions);

        var query = new GetUserSessionsQuery
        {
            UserId = "user-1",
            CurrentSessionId = currentSessionId
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Sessions.Should().HaveCount(3);

        var currentSession = result.Sessions.First(s => s.Id == currentSessionId);
        currentSession.Status.Should().Be("Current");
        currentSession.IsCurrent.Should().BeTrue();
        currentSession.Browser.Should().Be("Chrome");

        var activeSession = result.Sessions.First(s => s.Id == activeSessionId);
        activeSession.Status.Should().Be("Active");
        activeSession.IsCurrent.Should().BeFalse();

        var expiredSession = result.Sessions.First(s => s.Id == expiredSessionId);
        expiredSession.Status.Should().Be("Expired");
        expiredSession.IsCurrent.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_ReturnsEmptyList_WhenNoActiveSessions()
    {
        // Arrange
        _sessionServiceMock
            .Setup(x => x.GetActiveSessionsAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserSession>());

        var query = new GetUserSessionsQuery
        {
            UserId = "user-1",
            CurrentSessionId = Guid.NewGuid()
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Sessions.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_MapsLocationAndDeviceInfoCorrectly()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var sessions = new List<UserSession>
        {
            new()
            {
                Id = sessionId,
                UserId = "user-1",
                DeviceInfo = "Chrome on Windows",
                Browser = "Chrome",
                OperatingSystem = "Windows 10",
                IpAddress = "203.0.113.5",
                City = "Manchester",
                Country = "United Kingdom",
                LastActiveAt = DateTime.UtcNow.AddMinutes(-30),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            }
        };

        _sessionServiceMock
            .Setup(x => x.GetActiveSessionsAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessions);

        var query = new GetUserSessionsQuery
        {
            UserId = "user-1",
            CurrentSessionId = null
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var dto = result.Sessions.Single();
        dto.DeviceInfo.Should().Be("Chrome on Windows");
        dto.Browser.Should().Be("Chrome");
        dto.OperatingSystem.Should().Be("Windows 10");
        dto.IpAddress.Should().Be("203.0.113.5");
        dto.City.Should().Be("Manchester");
        dto.Country.Should().Be("United Kingdom");
        dto.Status.Should().Be("Active");
        dto.IsCurrent.Should().BeFalse();
    }
}
