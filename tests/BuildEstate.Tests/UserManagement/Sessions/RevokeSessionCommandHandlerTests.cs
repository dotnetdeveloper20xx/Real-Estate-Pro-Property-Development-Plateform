using BuildEstate.Application.Features.UserManagement.Sessions.Commands.RevokeSession;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Sessions;

public class RevokeSessionCommandHandlerTests
{
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<RevokeSessionCommandHandler>> _loggerMock;
    private readonly RevokeSessionCommandHandler _handler;

    public RevokeSessionCommandHandlerTests()
    {
        _sessionServiceMock = new Mock<ISessionService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<RevokeSessionCommandHandler>>();

        _handler = new RevokeSessionCommandHandler(
            _sessionServiceMock.Object,
            _tokenServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_RevokesSession_WhenNotCurrentSession()
    {
        // Arrange
        var sessionToRevoke = Guid.NewGuid();
        var currentSession = Guid.NewGuid();

        _sessionServiceMock
            .Setup(x => x.RevokeSessionAsync(sessionToRevoke, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _auditLogServiceMock
            .Setup(x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new RevokeSessionCommand
        {
            SessionId = sessionToRevoke,
            CurrentSessionId = currentSession,
            AdminUserId = "admin-001",
            AdminUserName = "Admin User",
            IpAddress = "192.168.1.1",
            CorrelationId = Guid.NewGuid().ToString()
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        _sessionServiceMock.Verify(
            x => x.RevokeSessionAsync(sessionToRevoke, "Admin revoked session", It.IsAny<CancellationToken>()),
            Times.Once);
        _auditLogServiceMock.Verify(
            x => x.LogAsync(It.Is<AuditLogEntry>(e =>
                e.Action == "SessionRevoked" &&
                e.PerformedByUserId == "admin-001" &&
                e.TargetEntityId == sessionToRevoke.ToString()),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_RejectsRevocation_WhenTargetIsCurrentSession()
    {
        // Arrange
        var sessionId = Guid.NewGuid();

        var command = new RevokeSessionCommand
        {
            SessionId = sessionId,
            CurrentSessionId = sessionId, // Same as target — should be rejected
            AdminUserId = "admin-001",
            AdminUserName = "Admin User",
            IpAddress = "192.168.1.1",
            CorrelationId = Guid.NewGuid().ToString()
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Cannot revoke the current session.");
        _sessionServiceMock.Verify(
            x => x.RevokeSessionAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
