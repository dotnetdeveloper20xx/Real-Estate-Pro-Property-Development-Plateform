using BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRolePermissions;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Roles.Commands.UpdateRolePermissions;

public class UpdateRolePermissionsCommandHandlerTests
{
    private readonly Mock<IRoleManagementService> _roleManagementServiceMock;
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<UpdateRolePermissionsCommandHandler>> _loggerMock;
    private readonly UpdateRolePermissionsCommandHandler _handler;

    public UpdateRolePermissionsCommandHandlerTests()
    {
        _roleManagementServiceMock = new Mock<IRoleManagementService>();
        _sessionServiceMock = new Mock<ISessionService>();
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<UpdateRolePermissionsCommandHandler>>();

        _handler = new UpdateRolePermissionsCommandHandler(
            _roleManagementServiceMock.Object,
            _sessionServiceMock.Object,
            _userIdentityServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);

        // Default setups
        _roleManagementServiceMock
            .Setup(x => x.TogglePermissionAsync(It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(TogglePermissionResult.Granted());

        _roleManagementServiceMock
            .Setup(x => x.GetRoleNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("TestRole");

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");
    }

    private static UpdateRolePermissionsCommand CreateValidCommand() => new()
    {
        RoleId = "role-001",
        PermissionId = Guid.NewGuid(),
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    [Fact]
    public async Task Handle_WhenPermissionGranted_ReturnsSuccessWithIsGrantedTrue()
    {
        // Arrange
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.TogglePermissionAsync(command.RoleId, command.PermissionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TogglePermissionResult.Granted());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.IsGranted.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenPermissionRevoked_ReturnsSuccessWithIsGrantedFalse()
    {
        // Arrange
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.TogglePermissionAsync(command.RoleId, command.PermissionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TogglePermissionResult.Revoked());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.IsGranted.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenSuccessful_RevokesSessionsForRole()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeSessionsForRoleAsync(command.RoleId, "Role permissions changed", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenSuccessful_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.Action == "RolePermissionChanged" &&
                    e.PerformedByUserId == command.AdminUserId &&
                    e.TargetEntityId == command.RoleId &&
                    e.TargetEntityType == "Role" &&
                    e.IpAddress == command.IpAddress &&
                    e.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenToggleFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.TogglePermissionAsync(command.RoleId, command.PermissionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TogglePermissionResult.Failure("Permission not found."));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Permission not found.");
    }

    [Fact]
    public async Task Handle_WhenToggleFails_DoesNotRevokeSessionsOrLogAudit()
    {
        // Arrange
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.TogglePermissionAsync(command.RoleId, command.PermissionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TogglePermissionResult.Failure("Permission not found."));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _sessionServiceMock.Verify(
            x => x.RevokeSessionsForRoleAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _auditLogServiceMock.Verify(
            x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
