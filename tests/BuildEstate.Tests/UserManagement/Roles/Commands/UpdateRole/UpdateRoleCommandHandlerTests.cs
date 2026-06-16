using BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRole;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Roles.Commands.UpdateRole;

public class UpdateRoleCommandHandlerTests
{
    private readonly Mock<IRoleManagementService> _roleManagementServiceMock;
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<UpdateRoleCommandHandler>> _loggerMock;
    private readonly UpdateRoleCommandHandler _handler;

    public UpdateRoleCommandHandlerTests()
    {
        _roleManagementServiceMock = new Mock<IRoleManagementService>();
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<UpdateRoleCommandHandler>>();

        _handler = new UpdateRoleCommandHandler(
            _roleManagementServiceMock.Object,
            _userIdentityServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);

        // Default setups
        _roleManagementServiceMock
            .Setup(x => x.IsBuiltInRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _roleManagementServiceMock
            .Setup(x => x.UpdateRoleAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");
    }

    private static UpdateRoleCommand CreateValidCommand() => new()
    {
        RoleId = "role-001",
        Name = "UpdatedRole",
        Description = "Updated description",
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    [Fact]
    public async Task Handle_WithValidNonBuiltInRole_UpdatesAndReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WithValidData_CallsUpdateRoleAsync()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _roleManagementServiceMock.Verify(
            x => x.UpdateRoleAsync(command.RoleId, command.Name, command.Description, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidData_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.Action == "RoleUpdated" &&
                    e.PerformedByUserId == command.AdminUserId &&
                    e.TargetEntityId == command.RoleId &&
                    e.TargetEntityType == "Role" &&
                    e.IpAddress == command.IpAddress &&
                    e.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenBuiltInRoleAndNameChanged_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = "NewName" };

        _roleManagementServiceMock
            .Setup(x => x.IsBuiltInRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _roleManagementServiceMock
            .Setup(x => x.GetRoleNameAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("OriginalName");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Built-in roles cannot be renamed.");
    }

    [Fact]
    public async Task Handle_WhenBuiltInRoleAndNameUnchanged_AllowsDescriptionUpdate()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = "SuperAdmin" };

        _roleManagementServiceMock
            .Setup(x => x.IsBuiltInRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _roleManagementServiceMock
            .Setup(x => x.GetRoleNameAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("SuperAdmin");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenUpdateFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var errors = new List<string> { "Role not found." };

        _roleManagementServiceMock
            .Setup(x => x.UpdateRoleAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Failure(errors));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Role not found.");
    }

    [Fact]
    public async Task Handle_WhenBuiltInRoleRenameRejected_DoesNotCallUpdateOrAudit()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = "RenamingAttempt" };

        _roleManagementServiceMock
            .Setup(x => x.IsBuiltInRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _roleManagementServiceMock
            .Setup(x => x.GetRoleNameAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("SuperAdmin");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _roleManagementServiceMock.Verify(
            x => x.UpdateRoleAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _auditLogServiceMock.Verify(
            x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
