using BuildEstate.Application.Features.UserManagement.Users.Commands.DeactivateUser;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Domain.Exceptions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Users.Commands.DeactivateUser;

public class DeactivateUserCommandHandlerTests
{
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<DeactivateUserCommandHandler>> _loggerMock;
    private readonly DeactivateUserCommandHandler _handler;

    public DeactivateUserCommandHandlerTests()
    {
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _sessionServiceMock = new Mock<ISessionService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<DeactivateUserCommandHandler>>();

        _handler = new DeactivateUserCommandHandler(
            _userIdentityServiceMock.Object,
            _sessionServiceMock.Object,
            _tokenServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static DeactivateUserCommand CreateValidCommand() => new()
    {
        UserId = "user-001",
        AdminUserId = "admin-001",
        AdminUserName = "Admin User",
        IpAddress = "192.168.1.100",
        CorrelationId = "corr-deactivate-001"
    };

    [Fact]
    public async Task Handle_WithValidUser_SetsIsActiveToFalseAndReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", true));

        _sessionServiceMock
            .Setup(x => x.RevokeAllUserSessionsAsync(command.UserId, "Account deactivated", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _tokenServiceMock
            .Setup(x => x.RevokeAllUserTokensAsync(command.UserId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.SessionRevocationFailed.Should().BeFalse();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithValidUser_RevokesAllSessionsAndTokens()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", true));

        _sessionServiceMock
            .Setup(x => x.RevokeAllUserSessionsAsync(command.UserId, "Account deactivated", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _tokenServiceMock
            .Setup(x => x.RevokeAllUserTokensAsync(command.UserId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Account deactivated", It.IsAny<CancellationToken>()),
            Times.Once);
        _tokenServiceMock.Verify(
            x => x.RevokeAllUserTokensAsync(command.UserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidUser_LogsAuditEntryWithOldAndNewValues()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", true));

        _sessionServiceMock
            .Setup(x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _tokenServiceMock
            .Setup(x => x.RevokeAllUserTokensAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.Action == "UserDeactivated" &&
                    e.PerformedByUserId == command.AdminUserId &&
                    e.PerformedByUserName == command.AdminUserName &&
                    e.TargetEntityType == "User" &&
                    e.TargetEntityId == command.UserId &&
                    e.TargetUserName == "John Doe" &&
                    e.OldValues!.Contains("true") &&
                    e.NewValues!.Contains("false") &&
                    e.AffectedFields == "IsActive" &&
                    e.IpAddress == command.IpAddress &&
                    e.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ThrowsEntityNotFoundException()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Failure(["User not found."]));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<EntityNotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenSessionRevocationFails_RetriesUpTo3Times()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", true));

        _sessionServiceMock
            .Setup(x => x.RevokeAllUserSessionsAsync(command.UserId, "Account deactivated", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Session store unavailable"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Account deactivated", It.IsAny<CancellationToken>()),
            Times.Exactly(3));
        result.Succeeded.Should().BeTrue();
        result.SessionRevocationFailed.Should().BeTrue();
        result.ErrorMessage.Should().Contain("Session revocation failed");
    }

    [Fact]
    public async Task Handle_WhenSessionRevocationFailsOnFirstAttemptButSucceedsOnSecond_ReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();
        var callCount = 0;

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", true));

        _sessionServiceMock
            .Setup(x => x.RevokeAllUserSessionsAsync(command.UserId, "Account deactivated", It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new InvalidOperationException("Transient error");
                return Task.CompletedTask;
            });

        _tokenServiceMock
            .Setup(x => x.RevokeAllUserTokensAsync(command.UserId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.SessionRevocationFailed.Should().BeFalse();
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Account deactivated", It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task Handle_WhenSessionRevocationFails_StillLogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", true));

        _sessionServiceMock
            .Setup(x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Session store unavailable"));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e => e.Action == "UserDeactivated"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserAlreadyDeactivated_StillDeactivatesSuccessfully()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.DeactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", false)); // PreviousIsActive = false

        _sessionServiceMock
            .Setup(x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _tokenServiceMock
            .Setup(x => x.RevokeAllUserTokensAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.OldValues!.Contains("false") &&
                    e.NewValues!.Contains("false")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
