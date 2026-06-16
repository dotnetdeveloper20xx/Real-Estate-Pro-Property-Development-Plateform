using BuildEstate.Application.Features.UserManagement.Users.Commands.ResetPassword;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class ResetPasswordCommandHandlerTests
{
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IPasswordHistoryService> _passwordHistoryServiceMock;
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<ResetPasswordCommandHandler>> _loggerMock;
    private readonly ResetPasswordCommandHandler _sut;

    public ResetPasswordCommandHandlerTests()
    {
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _passwordHistoryServiceMock = new Mock<IPasswordHistoryService>();
        _sessionServiceMock = new Mock<ISessionService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<ResetPasswordCommandHandler>>();

        _sut = new ResetPasswordCommandHandler(
            _userIdentityServiceMock.Object,
            _passwordHistoryServiceMock.Object,
            _sessionServiceMock.Object,
            _tokenServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static ResetPasswordCommand CreateValidCommand() => new()
    {
        UserId = "user-456",
        NewPassword = "NewSecure1!",
        AdminUserId = "admin-123",
        AdminUserName = "Jane Admin",
        IpAddress = "10.0.0.1",
        CorrelationId = "corr-reset-001"
    };

    [Fact]
    public async Task Handle_WithValidCommand_ReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();
        SetupSuccessPath(command);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithValidCommand_ChecksPasswordHistory()
    {
        // Arrange
        var command = CreateValidCommand();
        SetupSuccessPath(command);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _passwordHistoryServiceMock.Verify(
            x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCommand_ResetsPasswordViaIdentity()
    {
        // Arrange
        var command = CreateValidCommand();
        SetupSuccessPath(command);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.ResetPasswordAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()),
            Times.Once);
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
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Password reset by administrator", It.IsAny<CancellationToken>()),
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
                    entry.Action == "PasswordResetByAdmin" &&
                    entry.PerformedByUserId == command.AdminUserId &&
                    entry.PerformedByUserName == command.AdminUserName &&
                    entry.TargetEntityType == "User" &&
                    entry.TargetEntityId == command.UserId &&
                    entry.TargetUserName == "Target User" &&
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
    public async Task Handle_WithNonExistentUser_DoesNotAttemptReset()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.ResetPasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
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
    public async Task Handle_WithReusedPassword_DoesNotResetPassword()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.ResetPasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WhenIdentityResetFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userIdentityServiceMock
            .Setup(x => x.ResetPasswordAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PasswordChangeResult.Failure(new List<string> { "Password does not meet requirements." }.AsReadOnly()));

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("does not meet requirements");
    }

    [Fact]
    public async Task Handle_WhenIdentityResetFails_DoesNotRevokeSessionsOrRecordHistory()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userIdentityServiceMock
            .Setup(x => x.ResetPasswordAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PasswordChangeResult.Failure(new List<string> { "Error" }.AsReadOnly()));

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _passwordHistoryServiceMock.Verify(
            x => x.RecordPasswordChangeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        _tokenServiceMock.Verify(
            x => x.RevokeAllUserTokensAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private void SetupSuccessPath(ResetPasswordCommand command)
    {
        _userIdentityServiceMock
            .Setup(x => x.UserExistsAndIsActiveAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _passwordHistoryServiceMock
            .Setup(x => x.IsPasswordReusedAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userIdentityServiceMock
            .Setup(x => x.ResetPasswordAsync(command.UserId, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PasswordChangeResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetPasswordHashAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("hashed-new-password");

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Target User");
    }
}
