using BuildEstate.Application.Features.UserManagement.Roles.Commands.DeleteRole;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Roles.Commands.DeleteRole;

public class DeleteRoleCommandHandlerTests
{
    private readonly Mock<IRoleManagementService> _roleManagementServiceMock;
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<DeleteRoleCommandHandler>> _loggerMock;
    private readonly DeleteRoleCommandHandler _handler;

    public DeleteRoleCommandHandlerTests()
    {
        _roleManagementServiceMock = new Mock<IRoleManagementService>();
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<DeleteRoleCommandHandler>>();

        _handler = new DeleteRoleCommandHandler(
            _roleManagementServiceMock.Object,
            _userIdentityServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);

        // Default setups
        _roleManagementServiceMock
            .Setup(x => x.IsBuiltInRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _roleManagementServiceMock
            .Setup(x => x.GetUserCountForRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        _roleManagementServiceMock
            .Setup(x => x.GetRoleNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("TestRole");

        _roleManagementServiceMock
            .Setup(x => x.DeleteRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");
    }

    private static DeleteRoleCommand CreateValidCommand() => new()
    {
        RoleId = "role-001",
        ConfirmDeletion = true,
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    [Fact]
    public async Task Handle_WithValidNonBuiltInRole_DeletesAndReturnsSuccess()
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
    public async Task Handle_WithBuiltInRole_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.IsBuiltInRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Built-in roles cannot be deleted.");
    }

    [Fact]
    public async Task Handle_WithBuiltInRole_DoesNotCallDelete()
    {
        // Arrange
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.IsBuiltInRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _roleManagementServiceMock.Verify(
            x => x.DeleteRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WithAssignedUsersAndNoConfirmation_ReturnsConfirmationRequired()
    {
        // Arrange
        var command = CreateValidCommand() with { ConfirmDeletion = false };

        _roleManagementServiceMock
            .Setup(x => x.GetUserCountForRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(5);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.RequiresConfirmation.Should().BeTrue();
        result.AffectedUserCount.Should().Be(5);
    }

    [Fact]
    public async Task Handle_WithAssignedUsersAndConfirmation_ProceedsWithDeletion()
    {
        // Arrange
        var command = CreateValidCommand(); // ConfirmDeletion = true

        _roleManagementServiceMock
            .Setup(x => x.GetUserCountForRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(5);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        _roleManagementServiceMock.Verify(
            x => x.DeleteRoleAsync(command.RoleId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenDeleteSucceeds_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.Action == "RoleDeleted" &&
                    e.PerformedByUserId == command.AdminUserId &&
                    e.TargetEntityId == command.RoleId &&
                    e.TargetEntityType == "Role" &&
                    e.IpAddress == command.IpAddress &&
                    e.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenDeleteFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var errors = new List<string> { "Role deletion failed." };

        _roleManagementServiceMock
            .Setup(x => x.DeleteRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Failure(errors));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Role deletion failed.");
    }

    [Fact]
    public async Task Handle_WithNoAssignedUsersAndNoConfirmation_ProceedsDirectly()
    {
        // Arrange
        var command = CreateValidCommand() with { ConfirmDeletion = false };

        _roleManagementServiceMock
            .Setup(x => x.GetUserCountForRoleAsync(command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.RequiresConfirmation.Should().BeFalse();
    }
}
