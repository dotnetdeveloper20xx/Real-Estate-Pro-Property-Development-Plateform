using BuildEstate.Application.Features.UserManagement.Authentication.Commands.Logout;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class LogoutCommandHandlerTests
{
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<LogoutCommandHandler>> _loggerMock;
    private readonly LogoutCommandHandler _sut;

    public LogoutCommandHandlerTests()
    {
        _sessionServiceMock = new Mock<ISessionService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<LogoutCommandHandler>>();

        _sut = new LogoutCommandHandler(
            _sessionServiceMock.Object,
            _tokenServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_WithValidCommand_RevokesSessionAndRefreshToken()
    {
        // Arrange
        var command = new LogoutCommand
        {
            UserId = "user-123",
            SessionId = Guid.NewGuid(),
            RefreshToken = "valid-refresh-token",
            IpAddress = "192.168.1.100",
            CorrelationId = Guid.NewGuid().ToString()
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().Be(MediatR.Unit.Value);

        _sessionServiceMock.Verify(
            s => s.RevokeSessionAsync(command.SessionId, "User logged out", It.IsAny<CancellationToken>()),
            Times.Once);

        _tokenServiceMock.Verify(
            t => t.RevokeRefreshTokenAsync(command.RefreshToken, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCommand_LogsAuditEntry()
    {
        // Arrange
        var command = new LogoutCommand
        {
            UserId = "user-456",
            SessionId = Guid.NewGuid(),
            RefreshToken = "some-refresh-token",
            IpAddress = "10.0.0.1",
            CorrelationId = "corr-001"
        };

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            a => a.LogAsync(
                It.Is<AuditLogEntry>(entry =>
                    entry.Action == "UserLogout" &&
                    entry.PerformedByUserId == command.UserId &&
                    entry.IpAddress == command.IpAddress &&
                    entry.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithEmptyRefreshToken_SkipsTokenRevocation()
    {
        // Arrange
        var command = new LogoutCommand
        {
            UserId = "user-789",
            SessionId = Guid.NewGuid(),
            RefreshToken = "",
            IpAddress = "172.16.0.1",
            CorrelationId = "corr-002"
        };

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _tokenServiceMock.Verify(
            t => t.RevokeRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        // Session should still be revoked
        _sessionServiceMock.Verify(
            s => s.RevokeSessionAsync(command.SessionId, "User logged out", It.IsAny<CancellationToken>()),
            Times.Once);

        // Audit should still be logged
        _auditLogServiceMock.Verify(
            a => a.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithWhitespaceRefreshToken_SkipsTokenRevocation()
    {
        // Arrange
        var command = new LogoutCommand
        {
            UserId = "user-101",
            SessionId = Guid.NewGuid(),
            RefreshToken = "   ",
            IpAddress = "192.168.0.50",
            CorrelationId = "corr-003"
        };

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _tokenServiceMock.Verify(
            t => t.RevokeRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
