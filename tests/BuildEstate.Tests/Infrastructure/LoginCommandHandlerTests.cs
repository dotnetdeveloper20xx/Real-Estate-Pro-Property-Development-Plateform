using BuildEstate.Application.Features.UserManagement.Authentication.Commands.Login;
using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class LoginCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock;
    private readonly Mock<IAccountLockoutService> _lockoutServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<LoginCommandHandler>> _loggerMock;
    private readonly LoginCommandHandler _sut;

    public LoginCommandHandlerTests()
    {
        _identityServiceMock = new Mock<IIdentityService>();
        _lockoutServiceMock = new Mock<IAccountLockoutService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _sessionServiceMock = new Mock<ISessionService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<LoginCommandHandler>>();

        _sut = new LoginCommandHandler(
            _identityServiceMock.Object,
            _lockoutServiceMock.Object,
            _tokenServiceMock.Object,
            _sessionServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static LoginCommand CreateValidCommand() => new()
    {
        Email = "john.doe@example.com",
        Password = "SecureP@ss1",
        RememberMe = false,
        IpAddress = "192.168.1.100",
        UserAgent = "Mozilla/5.0",
        CorrelationId = "corr-123"
    };

    private static UserIdentityResult CreateActiveUser() => new()
    {
        UserId = "user-001",
        Email = "john.doe@example.com",
        FirstName = "John",
        LastName = "Doe",
        IsActive = true
    };

    #region Success Scenario

    [Fact]
    public async Task Handle_WithValidCredentials_ReturnsSuccessWithTokensAndUserInfo()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();
        var roles = new List<string> { "ProjectManager", "AcquisitionManager" };

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(user.UserId, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        _tokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                user.UserId, user.Email, user.FirstName, user.LastName,
                roles, command.RememberMe, command.UserAgent, command.IpAddress,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(("access-token-123", "refresh-token-456"));

        _sessionServiceMock
            .Setup(x => x.CreateSessionAsync(user.UserId, command.IpAddress, command.UserAgent, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserSession { Id = Guid.NewGuid(), UserId = user.UserId });

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
        result.Response.Should().NotBeNull();
        result.Response!.AccessToken.Should().Be("access-token-123");
        result.Response.RefreshToken.Should().Be("refresh-token-456");
        result.Response.User.Id.Should().Be(user.UserId);
        result.Response.User.Email.Should().Be(user.Email);
        result.Response.User.FirstName.Should().Be(user.FirstName);
        result.Response.User.LastName.Should().Be(user.LastName);
        result.Response.User.Roles.Should().BeEquivalentTo(roles);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_ResetsFailedAttempts()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        SetupSuccessfulLogin(command, user);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _lockoutServiceMock.Verify(
            x => x.ResetFailedAttemptsAsync(user.UserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_UpdatesLastLoginAt()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        SetupSuccessfulLogin(command, user);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _identityServiceMock.Verify(
            x => x.UpdateLastLoginAsync(user.UserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_CreatesSession()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        SetupSuccessfulLogin(command, user);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.CreateSessionAsync(user.UserId, command.IpAddress, command.UserAgent, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        SetupSuccessfulLogin(command, user);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(entry =>
                    entry.Action == "UserLogin" &&
                    entry.PerformedByUserId == user.UserId &&
                    entry.PerformedByUserName == $"{user.FirstName} {user.LastName}" &&
                    entry.IpAddress == command.IpAddress &&
                    entry.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithRememberMe_PassesRememberMeToTokenService()
    {
        // Arrange
        var command = CreateValidCommand() with { RememberMe = true };
        var user = CreateActiveUser();
        var roles = new List<string> { "SuperAdmin" };

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(user.UserId, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        _tokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                user.UserId, user.Email, user.FirstName, user.LastName,
                roles, true, command.UserAgent, command.IpAddress,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(("access-30day", "refresh-30day"));

        _sessionServiceMock
            .Setup(x => x.CreateSessionAsync(user.UserId, command.IpAddress, command.UserAgent, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserSession { Id = Guid.NewGuid(), UserId = user.UserId });

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        _tokenServiceMock.Verify(
            x => x.GenerateTokensAsync(
                user.UserId, user.Email, user.FirstName, user.LastName,
                roles, true, command.UserAgent, command.IpAddress,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    #endregion

    #region User Not Found

    [Fact]
    public async Task Handle_UserNotFound_ReturnsGenericError()
    {
        // Arrange
        var command = CreateValidCommand();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserIdentityResult?)null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid email or password.");
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task Handle_UserNotFound_DoesNotRevealUserDoesNotExist()
    {
        // Arrange
        var command = CreateValidCommand();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserIdentityResult?)null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert — message should NOT say "user not found"
        result.ErrorMessage.Should().NotContain("not found");
        result.ErrorMessage.Should().NotContain("does not exist");
        result.ErrorMessage.Should().Be("Invalid email or password.");
    }

    #endregion

    #region Deactivated Account

    [Fact]
    public async Task Handle_DeactivatedAccount_ReturnsDeactivatedMessage()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser() with { IsActive = false };

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Account is deactivated. Contact your administrator.");
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task Handle_DeactivatedAccount_DoesNotAttemptPasswordCheck()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser() with { IsActive = false };

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _identityServiceMock.Verify(
            x => x.CheckPasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion

    #region Locked Account

    [Fact]
    public async Task Handle_LockedAccount_ReturnsLockoutMessageWithRemainingTime()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _lockoutServiceMock
            .Setup(x => x.GetRemainingLockoutTimeAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TimeSpan.FromMinutes(12.5));

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Account locked");
        result.ErrorMessage.Should().Contain("13 minutes"); // Math.Ceiling(12.5) = 13
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task Handle_LockedAccount_DoesNotAttemptPasswordCheck()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _lockoutServiceMock
            .Setup(x => x.GetRemainingLockoutTimeAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TimeSpan.FromMinutes(10));

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _identityServiceMock.Verify(
            x => x.CheckPasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion

    #region Invalid Password

    [Fact]
    public async Task Handle_InvalidPassword_ReturnsGenericError()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(user.UserId, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _lockoutServiceMock
            .Setup(x => x.IncrementFailedAttemptsAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid email or password.");
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task Handle_InvalidPassword_IncrementsFailedAttempts()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(user.UserId, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _lockoutServiceMock
            .Setup(x => x.IncrementFailedAttemptsAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _lockoutServiceMock.Verify(
            x => x.IncrementFailedAttemptsAsync(user.UserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_InvalidPasswordTriggersLockout_ReturnsLockoutMessage()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(user.UserId, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _lockoutServiceMock
            .Setup(x => x.IncrementFailedAttemptsAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // lockout triggered

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Account locked");
        result.ErrorMessage.Should().Contain("15 minutes");
    }

    [Fact]
    public async Task Handle_InvalidPassword_DoesNotGenerateTokens()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateActiveUser();

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(user.UserId, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _lockoutServiceMock
            .Setup(x => x.IncrementFailedAttemptsAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _tokenServiceMock.Verify(
            x => x.GenerateTokensAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<IList<string>>(), It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion

    #region Helpers

    private void SetupSuccessfulLogin(LoginCommand command, UserIdentityResult user)
    {
        var roles = new List<string> { "ProjectManager" };

        _identityServiceMock
            .Setup(x => x.FindByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _lockoutServiceMock
            .Setup(x => x.IsLockedOutAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(user.UserId, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(user.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        _tokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                user.UserId, user.Email, user.FirstName, user.LastName,
                roles, command.RememberMe, command.UserAgent, command.IpAddress,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(("test-access-token", "test-refresh-token"));

        _sessionServiceMock
            .Setup(x => x.CreateSessionAsync(user.UserId, command.IpAddress, command.UserAgent, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserSession { Id = Guid.NewGuid(), UserId = user.UserId });
    }

    #endregion
}
