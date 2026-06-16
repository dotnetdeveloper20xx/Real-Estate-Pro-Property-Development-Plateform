using BuildEstate.Application.Features.UserManagement.Authentication.Commands.ChangePassword;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class ChangePasswordCommandHandlerTests
{
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IPasswordHistoryService> _passwordHistoryServiceMock;
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<ChangePasswordCommandHandler>> _loggerMock;
    private readonly ChangePasswordCommandHandler _sut;

    public ChangePasswordCommandHandlerTests()
    {
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _passwordHistoryServiceMock = new Mock<IPasswordHistoryService>();
        _sessionServiceMock = new Mock<ISessionService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<ChangePasswordCommandHandler>>();

        _sut = new ChangePasswordCommandHandler(
            _userIdentityServiceMock.Object,
            _passwordHistoryServiceMock.Object,
            _sessionServiceMock.Object,
            _tokenServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static ChangePasswordCommand CreateValidCommand() => new()
    {
        UserId = "user-123",
        CurrentPassword = "OldPassword1!",
        NewPassword = "NewPassword2@",
        IpAddress = "192.168.1.100",
        CorrelationId = "corr-abc-123"
    };

    [Fact]
    public async Task Handle_WithValidCommand_ReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userIdentityServiceMock
            .Setup(x => x.VerifyPasswordAsync(command.UserId, command.CurrentPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userIdentityServiceMock
            .Setup(x => x.ChangePasswordAsync(command.UserId, command.CurrentPassword, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PasswordChangeResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetPasswordHashAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("hashed-new-password");

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("John Doe");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithValidCommand_RecordsPasswordHistory()
    {
        // Arrange
        var command = CreateValidCommand();
        SetupSuccessPath(command);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _passwordHistoryServiceMock.Verify(
            x => x.RecordPasswordChangeAsync(command.UserId, "hashed-new-password", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCommand_RevokesAllSessionsAndTokens()
    {
        // Arrange
        var command = CreateValidCommand();
        SetupSuccessPath(command);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Password changed", It.IsAny<CancellationToken>()),
            Times.Once);

        _tokenServiceMock.Verify(
            x => x.RevokeAllUserTokensAsync(command.UserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCommand_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();
        SetupSuccessPath(command);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(entry =>
                    entry.Action == "PasswordChanged" &&
                    entry.PerformedByUserId == command.UserId &&
                    entry.PerformedByUserName == "John Doe" &&
                    entry.TargetEntityType == "User" &&
                    entry.TargetEntityId == command.UserId &&
                    entry.IpAddress == command.IpAddress &&
                    entry.CorrelationId == command.CorrelationId &&
                    entry.AffectedFields == "PasswordHash"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithNonExistentUser_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_WithWrongCurrentPassword_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userIdentityServiceMock
            .Setup(x => x.VerifyPasswordAsync(command.UserId, command.CurrentPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Current password is incorrect");
    }

    [Fact]
    public async Task Handle_WithWrongCurrentPassword_DoesNotChangePassword()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userIdentityServiceMock
            .Setup(x => x.VerifyPasswordAsync(command.UserId, command.CurrentPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.ChangePasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WithReusedPassword_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userIdentityServiceMock
            .Setup(x => x.VerifyPasswordAsync(command.UserId, command.CurrentPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("last 5 passwords");
    }

    [Fact]
    public async Task Handle_WithReusedPassword_DoesNotChangePassword()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userIdentityServiceMock
            .Setup(x => x.VerifyPasswordAsync(command.UserId, command.CurrentPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.ChangePasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WhenIdentityChangePasswordFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userIdentityServiceMock
            .Setup(x => x.VerifyPasswordAsync(command.UserId, command.CurrentPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userIdentityServiceMock
            .Setup(x => x.ChangePasswordAsync(command.UserId, command.CurrentPassword, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PasswordChangeResult.Failure(new List<string> { "Password does not meet requirements." }.AsReadOnly()));

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("does not meet requirements");
    }

    private void SetupSuccessPath(ChangePasswordCommand command)
    {
        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userIdentityServiceMock
            .Setup(x => x.VerifyPasswordAsync(command.UserId, command.CurrentPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userIdentityServiceMock
            .Setup(x => x.ChangePasswordAsync(command.UserId, command.CurrentPassword, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PasswordChangeResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetPasswordHashAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("hashed-new-password");

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("John Doe");
    }
}
