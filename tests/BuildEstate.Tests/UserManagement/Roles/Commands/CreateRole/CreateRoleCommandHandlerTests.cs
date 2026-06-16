using BuildEstate.Application.Features.UserManagement.Roles.Commands.CreateRole;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Roles.Commands.CreateRole;

public class CreateRoleCommandHandlerTests
{
    private readonly Mock<IRoleManagementService> _roleManagementServiceMock;
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<CreateRoleCommandHandler>> _loggerMock;
    private readonly CreateRoleCommandHandler _handler;

    public CreateRoleCommandHandlerTests()
    {
        _roleManagementServiceMock = new Mock<IRoleManagementService>();
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<CreateRoleCommandHandler>>();

        _handler = new CreateRoleCommandHandler(
            _roleManagementServiceMock.Object,
            _userIdentityServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static CreateRoleCommand CreateValidCommand() => new()
    {
        Name = "CustomRole",
        Description = "A custom role for testing",
        PermissionIds = [Guid.NewGuid(), Guid.NewGuid()],
        AdminUserId = "admin-user-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-12345"
    };

    [Fact]
    public async Task Handle_WithValidData_CreatesRoleAndReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdRoleId = "new-role-001";

        _roleManagementServiceMock
            .Setup(x => x.CreateRoleAsync(command.Name, command.Description, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoleResult.Success(createdRoleId));

        _roleManagementServiceMock
            .Setup(x => x.AssignPermissionsAsync(createdRoleId, command.PermissionIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.RoleId.Should().Be(createdRoleId);
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WithValidData_AssignsPermissions()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdRoleId = "new-role-001";

        _roleManagementServiceMock
            .Setup(x => x.CreateRoleAsync(command.Name, command.Description, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoleResult.Success(createdRoleId));

        _roleManagementServiceMock
            .Setup(x => x.AssignPermissionsAsync(createdRoleId, command.PermissionIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _roleManagementServiceMock.Verify(
            x => x.AssignPermissionsAsync(createdRoleId, command.PermissionIds, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidData_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdRoleId = "new-role-001";

        _roleManagementServiceMock
            .Setup(x => x.CreateRoleAsync(command.Name, command.Description, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoleResult.Success(createdRoleId));

        _roleManagementServiceMock
            .Setup(x => x.AssignPermissionsAsync(It.IsAny<string>(), It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.Action == "RoleCreated" &&
                    e.PerformedByUserId == command.AdminUserId &&
                    e.TargetEntityId == createdRoleId &&
                    e.TargetEntityType == "Role" &&
                    e.IpAddress == command.IpAddress &&
                    e.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenRoleCreationFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var errors = new List<string> { "Role creation failed in identity store." };

        _roleManagementServiceMock
            .Setup(x => x.CreateRoleAsync(command.Name, command.Description, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoleResult.Failure(errors));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Role creation failed in identity store.");
        result.RoleId.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenPermissionAssignmentFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdRoleId = "new-role-001";
        var permissionErrors = new List<string> { "Permission not found." };

        _roleManagementServiceMock
            .Setup(x => x.CreateRoleAsync(command.Name, command.Description, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoleResult.Success(createdRoleId));

        _roleManagementServiceMock
            .Setup(x => x.AssignPermissionsAsync(createdRoleId, command.PermissionIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Failure(permissionErrors));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Permission not found.");
    }

    [Fact]
    public async Task Handle_WithEmptyPermissions_SkipsPermissionAssignment()
    {
        // Arrange
        var command = CreateValidCommand() with { PermissionIds = [] };
        var createdRoleId = "new-role-001";

        _roleManagementServiceMock
            .Setup(x => x.CreateRoleAsync(command.Name, command.Description, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoleResult.Success(createdRoleId));

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        _roleManagementServiceMock.Verify(
            x => x.AssignPermissionsAsync(It.IsAny<string>(), It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WhenRoleCreationFails_DoesNotAssignPermissionsOrLogAudit()
    {
        // Arrange
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.CreateRoleAsync(command.Name, command.Description, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoleResult.Failure("Creation failed."));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _roleManagementServiceMock.Verify(
            x => x.AssignPermissionsAsync(It.IsAny<string>(), It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _auditLogServiceMock.Verify(
            x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
