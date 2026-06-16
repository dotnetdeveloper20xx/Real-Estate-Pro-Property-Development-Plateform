using BuildEstate.Application.Features.UserManagement.Sessions.Commands.RevokeAllSessions;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Sessions;

public class RevokeAllSessionsCommandHandlerTests
{
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<RevokeAllSessionsCommandHandler>> _loggerMock;
    private readonly RevokeAllSessionsCommandHandler _handler;

    public RevokeAllSessionsCommandHandlerTests()
    {
        _sessionServiceMock = new Mock<ISessionService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<RevokeAllSessionsCommandHandler>>();

        _handler = new RevokeAllSessionsCommandHandler(
            _sessionServiceMock.Object,
            _tokenServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_RevokesAllSessionsExceptCurrent()
    {
        // Arrange
        var currentSessionId = Guid.NewGuid();
        var otherSession1 = Guid.NewGuid();
        var otherSession2 = Guid.NewGuid();

        var sessions = new List<UserSession>
        {
            new() { Id = currentSessionId, UserId = "user-1", IsRevoked = false, ExpiresAt = DateTime.UtcNow.AddDays(7) },
            new() { Id = otherSession1, UserId = "user-1", IsRevoked = false, ExpiresAt = DateTime.UtcNow.AddDays(5) },
            new() { Id = otherSession2, UserId = "user-1", IsRevoked = false, ExpiresAt = DateTime.UtcNow.AddDays(3) }
        };

        _sessionServiceMock
            .Setup(x => x.GetActiveSessionsAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessions);

        _sessionServiceMock
            .Setup(x => x.RevokeSessionAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _auditLogServiceMock
            .Setup(x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new RevokeAllSessionsCommand
        {
            UserId = "user-1",
            CurrentSessionId = currentSessionId,
            AdminUserId = "admin-001",
            AdminUserName = "Admin User",
            IpAddress = "192.168.1.1",
            CorrelationId = Guid.NewGuid().ToString()
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.RevokedCount.Should().Be(2);

        // Should revoke both non-current sessions
        _sessionServiceMock.Verify(
            x => x.RevokeSessionAsync(otherSession1, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
        _sessionServiceMock.Verify(
            x => x.RevokeSessionAsync(otherSession2, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);

        // Should NOT revoke the current session
        _sessionServiceMock.Verify(
            x => x.RevokeSessionAsync(currentSessionId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        // Should log audit entry
        _auditLogServiceMock.Verify(
            x => x.LogAsync(It.Is<AuditLogEntry>(e =>
                e.Action == "AllSessionsRevoked" &&
                e.TargetEntityId == "user-1"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ReturnsZeroCount_WhenNoOtherActiveSessions()
    {
        // Arrange
        var currentSessionId = Guid.NewGuid();
        var sessions = new List<UserSession>
        {
            new() { Id = currentSessionId, UserId = "user-1", IsRevoked = false, ExpiresAt = DateTime.UtcNow.AddDays(7) }
        };

        _sessionServiceMock
            .Setup(x => x.GetActiveSessionsAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessions);

        var command = new RevokeAllSessionsCommand
        {
            UserId = "user-1",
            CurrentSessionId = currentSessionId,
            AdminUserId = "admin-001",
            AdminUserName = "Admin User",
            IpAddress = "192.168.1.1",
            CorrelationId = Guid.NewGuid().ToString()
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.RevokedCount.Should().Be(0);
        _sessionServiceMock.Verify(
            x => x.RevokeSessionAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ReturnsZeroCount_WhenNoSessionsExist()
    {
        // Arrange
        _sessionServiceMock
            .Setup(x => x.GetActiveSessionsAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserSession>());

        var command = new RevokeAllSessionsCommand
        {
            UserId = "user-1",
            CurrentSessionId = Guid.NewGuid(),
            AdminUserId = "admin-001",
            AdminUserName = "Admin User",
            IpAddress = "192.168.1.1",
            CorrelationId = Guid.NewGuid().ToString()
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.RevokedCount.Should().Be(0);
    }
}
