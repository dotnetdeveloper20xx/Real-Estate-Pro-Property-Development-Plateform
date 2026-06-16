using BuildEstate.Application.Features.UserManagement.Users.Commands.UpdateUser;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class UpdateUserCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock;
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<UpdateUserCommandHandler>> _loggerMock;
    private readonly UpdateUserCommandHandler _sut;

    public UpdateUserCommandHandlerTests()
    {
        _identityServiceMock = new Mock<IIdentityService>();
        _sessionServiceMock = new Mock<ISessionService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<UpdateUserCommandHandler>>();

        _sut = new UpdateUserCommandHandler(
            _identityServiceMock.Object,
            _sessionServiceMock.Object,
            _tokenServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static UpdateUserCommand CreateValidCommand() => new()
    {
        UserId = "user-001",
        FirstName = "Jane",
        LastName = "Smith",
        Email = "jane.smith@example.com",
        Roles = new List<string> { "ProjectManager", "AcquisitionManager" },
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.100",
        CorrelationId = "corr-update-001"
    };

    private static UserIdentityResult CreateExistingUser() => new()
    {
        UserId = "user-001",
        Email = "john.doe@example.com",
        FirstName = "John",
        LastName = "Doe",
        IsActive = true
    };

    #region Success Scenarios

    [Fact]
    public async Task Handle_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdate(command, user, currentRoles);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithValidData_UpdatesUserProfile()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdate(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _identityServiceMock.Verify(
            x => x.UpdateUserAsync(
                command.UserId, command.FirstName, command.LastName, command.Email,
                command.AdminUserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidData_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdate(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(entry =>
                    entry.Action == "UserUpdated" &&
                    entry.PerformedByUserId == command.AdminUserId &&
                    entry.TargetEntityId == command.UserId &&
                    entry.IpAddress == command.IpAddress &&
                    entry.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithSameRoles_DoesNotRevokeSessions()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateExistingUser();
        // Same roles as in the command
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdate(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _tokenServiceMock.Verify(
            x => x.RevokeAllUserTokensAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WithSameEmail_SkipsEmailUniquenessCheck()
    {
        // Arrange
        var command = CreateValidCommand() with { Email = "john.doe@example.com" }; // same as existing
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdate(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _identityServiceMock.Verify(
            x => x.IsEmailTakenAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion

    #region User Not Found

    [Fact]
    public async Task Handle_UserNotFound_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _identityServiceMock
            .Setup(x => x.FindByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserIdentityResult?)null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("User not found.");
    }

    [Fact]
    public async Task Handle_UserNotFound_DoesNotUpdateAnything()
    {
        // Arrange
        var command = CreateValidCommand();

        _identityServiceMock
            .Setup(x => x.FindByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserIdentityResult?)null);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _identityServiceMock.Verify(
            x => x.UpdateUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _identityServiceMock.Verify(
            x => x.UpdateUserRolesAsync(It.IsAny<string>(), It.IsAny<IList<string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _auditLogServiceMock.Verify(
            x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion

    #region Email Uniqueness

    [Fact]
    public async Task Handle_EmailAlreadyInUse_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateExistingUser();

        _identityServiceMock
            .Setup(x => x.FindByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _identityServiceMock
            .Setup(x => x.IsEmailTakenAsync(command.Email, command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Email address is already in use.");
    }

    #endregion

    #region Role Change Triggers Session Revocation

    [Fact]
    public async Task Handle_RolesChanged_RevokesAllSessions()
    {
        // Arrange
        var command = CreateValidCommand() with
        {
            Roles = new List<string> { "SuperAdmin" } // Different from current roles
        };
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdateWithRoleChange(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Role assignment changed", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_RolesChanged_RevokesAllTokens()
    {
        // Arrange
        var command = CreateValidCommand() with
        {
            Roles = new List<string> { "SuperAdmin" }
        };
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdateWithRoleChange(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _tokenServiceMock.Verify(
            x => x.RevokeAllUserTokensAsync(command.UserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_RolesChanged_UpdatesRoles()
    {
        // Arrange
        var command = CreateValidCommand() with
        {
            Roles = new List<string> { "SuperAdmin" }
        };
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdateWithRoleChange(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _identityServiceMock.Verify(
            x => x.UpdateUserRolesAsync(command.UserId, command.Roles, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_RolesChanged_LogsAuditWithRoleChangeDetails()
    {
        // Arrange
        var command = CreateValidCommand() with
        {
            Roles = new List<string> { "SuperAdmin" }
        };
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdateWithRoleChange(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(entry =>
                    entry.Action == "UserUpdated" &&
                    entry.AffectedFields!.Contains("Roles") &&
                    entry.Details!.Contains("role change")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_RoleAddedToExisting_StillTriggersRevocation()
    {
        // Arrange: user has ProjectManager, command adds SuperAdmin
        var command = CreateValidCommand() with
        {
            Roles = new List<string> { "ProjectManager", "SuperAdmin" }
        };
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager" };

        SetupSuccessfulUpdateWithRoleChange(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Role assignment changed", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_RoleRemovedFromExisting_StillTriggersRevocation()
    {
        // Arrange: user has ProjectManager + AcquisitionManager, command has only ProjectManager
        var command = CreateValidCommand() with
        {
            Roles = new List<string> { "ProjectManager" }
        };
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager", "AcquisitionManager" };

        SetupSuccessfulUpdateWithRoleChange(command, user, currentRoles);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeAllUserSessionsAsync(command.UserId, "Role assignment changed", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    #endregion

    #region Profile Update Failure

    [Fact]
    public async Task Handle_ProfileUpdateFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var user = CreateExistingUser();

        _identityServiceMock
            .Setup(x => x.FindByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _identityServiceMock
            .Setup(x => x.IsEmailTakenAsync(command.Email, command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.UpdateUserAsync(
                command.UserId, command.FirstName, command.LastName, command.Email,
                command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Failed to update user profile.");
    }

    #endregion

    #region Role Update Failure

    [Fact]
    public async Task Handle_RoleUpdateFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand() with
        {
            Roles = new List<string> { "SuperAdmin" }
        };
        var user = CreateExistingUser();
        var currentRoles = new List<string> { "ProjectManager" };

        _identityServiceMock
            .Setup(x => x.FindByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _identityServiceMock
            .Setup(x => x.IsEmailTakenAsync(command.Email, command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.UpdateUserAsync(
                command.UserId, command.FirstName, command.LastName, command.Email,
                command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentRoles);

        _identityServiceMock
            .Setup(x => x.UpdateUserRolesAsync(command.UserId, command.Roles, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Failed to update user roles.");
    }

    #endregion

    #region Helpers

    private void SetupSuccessfulUpdate(UpdateUserCommand command, UserIdentityResult user, IList<string> currentRoles)
    {
        _identityServiceMock
            .Setup(x => x.FindByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _identityServiceMock
            .Setup(x => x.IsEmailTakenAsync(command.Email, command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.UpdateUserAsync(
                command.UserId, command.FirstName, command.LastName, command.Email,
                command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentRoles);
    }

    private void SetupSuccessfulUpdateWithRoleChange(UpdateUserCommand command, UserIdentityResult user, IList<string> currentRoles)
    {
        _identityServiceMock
            .Setup(x => x.FindByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _identityServiceMock
            .Setup(x => x.IsEmailTakenAsync(command.Email, command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _identityServiceMock
            .Setup(x => x.UpdateUserAsync(
                command.UserId, command.FirstName, command.LastName, command.Email,
                command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentRoles);

        _identityServiceMock
            .Setup(x => x.UpdateUserRolesAsync(command.UserId, command.Roles, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
    }

    #endregion
}
