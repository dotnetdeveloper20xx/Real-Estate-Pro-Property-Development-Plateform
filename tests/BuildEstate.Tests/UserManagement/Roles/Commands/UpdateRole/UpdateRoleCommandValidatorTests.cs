using BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRole;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using Moq;

namespace BuildEstate.Tests.UserManagement.Roles.Commands.UpdateRole;

public class UpdateRoleCommandValidatorTests
{
    private readonly Mock<IRoleManagementService> _roleManagementServiceMock;
    private readonly UpdateRoleCommandValidator _validator;

    public UpdateRoleCommandValidatorTests()
    {
        _roleManagementServiceMock = new Mock<IRoleManagementService>();

        // Default: role name doesn't exist (for another role)
        _roleManagementServiceMock
            .Setup(x => x.RoleNameExistsExcludingAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _validator = new UpdateRoleCommandValidator(_roleManagementServiceMock.Object);
    }

    private static UpdateRoleCommand CreateValidCommand() => new()
    {
        RoleId = "role-001",
        Name = "ValidRoleName",
        Description = "A valid description",
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    [Fact]
    public async Task Validate_WithValidData_Passes()
    {
        var result = await _validator.ValidateAsync(CreateValidCommand());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Validate_WithEmptyRoleId_Fails()
    {
        var command = CreateValidCommand() with { RoleId = "" };
        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "RoleId");
    }

    [Fact]
    public async Task Validate_WithEmptyName_Fails()
    {
        var command = CreateValidCommand() with { Name = "" };
        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "Name" && e.ErrorMessage.Contains("required"));
    }

    [Fact]
    public async Task Validate_WithNameOver50Chars_Fails()
    {
        var command = CreateValidCommand() with { Name = new string('a', 51) };
        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "Name" && e.ErrorMessage.Contains("50"));
    }

    [Fact]
    public async Task Validate_WithInvalidNameCharacters_Fails()
    {
        var command = CreateValidCommand() with { Name = "Invalid Name!" };
        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "Name" && e.ErrorMessage.Contains("alphanumeric"));
    }

    [Fact]
    public async Task Validate_WithDuplicateName_Fails()
    {
        var command = CreateValidCommand();

        _roleManagementServiceMock
            .Setup(x => x.RoleNameExistsExcludingAsync(command.Name, command.RoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "Name" && e.ErrorMessage.Contains("already exists"));
    }

    [Fact]
    public async Task Validate_WithEmptyDescription_Fails()
    {
        var command = CreateValidCommand() with { Description = "" };
        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "Description");
    }

    [Fact]
    public async Task Validate_WithDescriptionOver200Chars_Fails()
    {
        var command = CreateValidCommand() with { Description = new string('x', 201) };
        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "Description" && e.ErrorMessage.Contains("200"));
    }

    [Fact]
    public async Task Validate_WithEmptyAdminUserId_Fails()
    {
        var command = CreateValidCommand() with { AdminUserId = "" };
        var result = await _validator.ValidateAsync(command);
        result.Errors.Should().Contain(e => e.PropertyName == "AdminUserId");
    }
}
