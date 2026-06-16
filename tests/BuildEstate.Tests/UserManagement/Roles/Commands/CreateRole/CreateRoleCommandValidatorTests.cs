using BuildEstate.Application.Features.UserManagement.Roles.Commands.CreateRole;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using FluentValidation.TestHelper;
using Moq;

namespace BuildEstate.Tests.UserManagement.Roles.Commands.CreateRole;

public class CreateRoleCommandValidatorTests
{
    private readonly Mock<IRoleManagementService> _roleManagementServiceMock;
    private readonly CreateRoleCommandValidator _validator;

    public CreateRoleCommandValidatorTests()
    {
        _roleManagementServiceMock = new Mock<IRoleManagementService>();

        // Default: role name doesn't exist
        _roleManagementServiceMock
            .Setup(x => x.RoleNameExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _validator = new CreateRoleCommandValidator(_roleManagementServiceMock.Object);
    }

    private static CreateRoleCommand CreateValidCommand() => new()
    {
        Name = "CustomRole",
        Description = "A custom role for testing purposes",
        PermissionIds = [],
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    [Fact]
    public async Task Validate_WithValidCommand_ShouldPassValidation()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Validate_WithHyphenatedName_ShouldPassValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = "Custom-Role-Name" };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Validate_WithAlphanumericName_ShouldPassValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = "Role123" };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_WithEmptyName_ShouldFail(string? name)
    {
        // Arrange
        var command = CreateValidCommand() with { Name = name ?? string.Empty };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Role name is required.");
    }

    [Fact]
    public async Task Validate_WithNameExceeding50Characters_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = new string('A', 51) };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Role name must not exceed 50 characters.");
    }

    [Fact]
    public async Task Validate_WithNameAtExactly50Characters_ShouldPass()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = new string('A', 50) };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData("Role With Spaces")]
    [InlineData("Role_Underscore")]
    [InlineData("Role.Dot")]
    [InlineData("Role@Symbol")]
    [InlineData("Role!Bang")]
    public async Task Validate_WithInvalidNameCharacters_ShouldFail(string name)
    {
        // Arrange
        var command = CreateValidCommand() with { Name = name };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Role name must contain only alphanumeric characters and hyphens.");
    }

    [Fact]
    public async Task Validate_WithDuplicateName_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand();
        _roleManagementServiceMock
            .Setup(x => x.RoleNameExistsAsync(command.Name, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("A role with this name already exists.");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_WithEmptyDescription_ShouldFail(string? description)
    {
        // Arrange
        var command = CreateValidCommand() with { Description = description ?? string.Empty };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Description)
            .WithErrorMessage("Description is required.");
    }

    [Fact]
    public async Task Validate_WithDescriptionExceeding200Characters_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand() with { Description = new string('D', 201) };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Description)
            .WithErrorMessage("Description must not exceed 200 characters.");
    }

    [Fact]
    public async Task Validate_WithDescriptionAtExactly200Characters_ShouldPass()
    {
        // Arrange
        var command = CreateValidCommand() with { Description = new string('D', 200) };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public async Task Validate_WithEmptyAdminUserId_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand() with { AdminUserId = "" };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.AdminUserId)
            .WithErrorMessage("Admin user ID is required.");
    }

    [Fact]
    public async Task Validate_WithMultipleViolations_ShouldReportAllErrors()
    {
        // Arrange
        var command = CreateValidCommand() with
        {
            Name = "",
            Description = "",
            AdminUserId = ""
        };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.Errors.Should().HaveCountGreaterThanOrEqualTo(3);
    }
}
