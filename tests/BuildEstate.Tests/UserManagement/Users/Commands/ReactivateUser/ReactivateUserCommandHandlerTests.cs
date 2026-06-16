using BuildEstate.Application.Features.UserManagement.Users.Commands.ReactivateUser;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Domain.Exceptions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Users.Commands.ReactivateUser;

public class ReactivateUserCommandHandlerTests
{
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<ReactivateUserCommandHandler>> _loggerMock;
    private readonly ReactivateUserCommandHandler _handler;

    public ReactivateUserCommandHandlerTests()
    {
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<ReactivateUserCommandHandler>>();

        _handler = new ReactivateUserCommandHandler(
            _userIdentityServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static ReactivateUserCommand CreateValidCommand() => new()
    {
        UserId = "user-001",
        AdminUserId = "admin-001",
        AdminUserName = "Admin User",
        IpAddress = "192.168.1.100",
        CorrelationId = "corr-reactivate-001"
    };

    [Fact]
    public async Task Handle_WithValidUser_SetsIsActiveToTrueAndReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.ReactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", false));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithValidUser_LogsAuditEntryWithOldAndNewValues()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.ReactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", false));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.Action == "UserReactivated" &&
                    e.PerformedByUserId == command.AdminUserId &&
                    e.PerformedByUserName == command.AdminUserName &&
                    e.TargetEntityType == "User" &&
                    e.TargetEntityId == command.UserId &&
                    e.TargetUserName == "John Doe" &&
                    e.OldValues!.Contains("false") &&
                    e.NewValues!.Contains("true") &&
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
            .Setup(x => x.ReactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Failure(["User not found."]));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<EntityNotFoundException>();
    }

    [Fact]
    public async Task Handle_WithValidUser_CallsReactivateUserAsync()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.ReactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", false));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.ReactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithAlreadyActiveUser_StillReactivatesSuccessfully()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.ReactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("John Doe", true)); // PreviousIsActive = true

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.OldValues!.Contains("true") &&
                    e.NewValues!.Contains("true")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidUser_AuditEntryContainsCorrectDetails()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.ReactivateUserAsync(command.UserId, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(UserStatusChangeResult.Success("Jane Smith", false));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _auditLogServiceMock.Verify(
            x => x.LogAsync(
                It.Is<AuditLogEntry>(e =>
                    e.Details == "User account reactivated by administrator." &&
                    e.TargetUserName == "Jane Smith"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
