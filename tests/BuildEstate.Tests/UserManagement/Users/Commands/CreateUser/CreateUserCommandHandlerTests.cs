using BuildEstate.Application.Features.UserManagement.Users.Commands.CreateUser;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.Users.Commands.CreateUser;

public class CreateUserCommandHandlerTests
{
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly Mock<IPasswordHistoryService> _passwordHistoryServiceMock;
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<CreateUserCommandHandler>> _loggerMock;
    private readonly CreateUserCommandHandler _handler;

    public CreateUserCommandHandlerTests()
    {
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _passwordHistoryServiceMock = new Mock<IPasswordHistoryService>();
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<CreateUserCommandHandler>>();

        _handler = new CreateUserCommandHandler(
            _userIdentityServiceMock.Object,
            _passwordHistoryServiceMock.Object,
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    private static CreateUserCommand CreateValidCommand() => new()
    {
        FirstName = "John",
        LastName = "Doe",
        Email = "john.doe@buildestate.com",
        Password = "SecureP@ss1",
        Roles = ["ProjectManager", "Admin"],
        AdminUserId = "admin-user-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-12345"
    };

    [Fact]
    public async Task Handle_WithValidData_CreatesUserAndReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdUserId = "new-user-001";
        var passwordHash = "hashed-password-value";

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                command.FirstName, command.LastName, command.Email,
                command.Password, command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Success(createdUserId, passwordHash));

        _userIdentityServiceMock
            .Setup(x => x.AssignRolesAsync(createdUserId, command.Roles, It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(command.AdminUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.UserId.Should().Be(createdUserId);
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WithValidData_AssignsRoles()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdUserId = "new-user-001";

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Success(createdUserId, "hash"));

        _userIdentityServiceMock
            .Setup(x => x.AssignRolesAsync(createdUserId, command.Roles, It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.AssignRolesAsync(createdUserId, command.Roles, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidData_RecordsPasswordHistory()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdUserId = "new-user-001";
        var passwordHash = "hashed-password-value";

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Success(createdUserId, passwordHash));

        _userIdentityServiceMock
            .Setup(x => x.AssignRolesAsync(It.IsAny<string>(), It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _passwordHistoryServiceMock.Verify(
            x => x.RecordPasswordChangeAsync(createdUserId, passwordHash, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidData_LogsAuditEntry()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdUserId = "new-user-001";

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Success(createdUserId, "hash"));

        _userIdentityServiceMock
            .Setup(x => x.AssignRolesAsync(It.IsAny<string>(), It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
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
                    e.Action == "UserCreated" &&
                    e.PerformedByUserId == command.AdminUserId &&
                    e.TargetEntityId == createdUserId &&
                    e.IpAddress == command.IpAddress &&
                    e.CorrelationId == command.CorrelationId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserCreationFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var errors = new List<string> { "Email is already taken." };

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Failure(errors));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Email is already taken.");
        result.UserId.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenRoleAssignmentFails_ReturnsFailure()
    {
        // Arrange
        var command = CreateValidCommand();
        var createdUserId = "new-user-001";
        var roleErrors = new List<string> { "Role 'ProjectManager' does not exist." };

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Success(createdUserId, "hash"));

        _userIdentityServiceMock
            .Setup(x => x.AssignRolesAsync(createdUserId, command.Roles, It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Failure(roleErrors));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeFalse();
        result.Errors.Should().Contain("Role 'ProjectManager' does not exist.");
    }

    [Fact]
    public async Task Handle_WithEmptyRoles_SkipsRoleAssignment()
    {
        // Arrange
        var command = CreateValidCommand() with { Roles = [] };
        var createdUserId = "new-user-001";

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Success(createdUserId, "hash"));

        _userIdentityServiceMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        _userIdentityServiceMock.Verify(
            x => x.AssignRolesAsync(It.IsAny<string>(), It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WhenUserCreationFails_DoesNotAssignRolesOrRecordHistory()
    {
        // Arrange
        var command = CreateValidCommand();

        _userIdentityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateUserIdentityResult.Failure(["Creation failed."]));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            x => x.AssignRolesAsync(It.IsAny<string>(), It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _passwordHistoryServiceMock.Verify(
            x => x.RecordPasswordChangeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _auditLogServiceMock.Verify(
            x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
