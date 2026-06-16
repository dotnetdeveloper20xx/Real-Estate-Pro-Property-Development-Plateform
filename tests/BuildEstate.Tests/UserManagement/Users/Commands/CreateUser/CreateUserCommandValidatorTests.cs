using BuildEstate.Application.Features.UserManagement.Users.Commands.CreateUser;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using FluentValidation.TestHelper;
using Moq;

namespace BuildEstate.Tests.UserManagement.Users.Commands.CreateUser;

public class CreateUserCommandValidatorTests
{
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly CreateUserCommandValidator _validator;

    public CreateUserCommandValidatorTests()
    {
        _userIdentityServiceMock = new Mock<IUserIdentityService>();

        // Default: email doesn't exist, roles exist
        _userIdentityServiceMock
            .Setup(x => x.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userIdentityServiceMock
            .Setup(x => x.RoleExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _validator = new CreateUserCommandValidator(_userIdentityServiceMock.Object);
    }

    private static CreateUserCommand CreateValidCommand() => new()
    {
        FirstName = "John",
        LastName = "Doe",
        Email = "john.doe@buildestate.com",
        Password = "SecureP@ss1",
        Roles = ["ProjectManager"],
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

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_WithEmptyFirstName_ShouldFail(string? firstName)
    {
        // Arrange
        var command = CreateValidCommand() with { FirstName = firstName ?? string.Empty };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FirstName)
            .WithErrorMessage("First name is required.");
    }

    [Fact]
    public async Task Validate_WithFirstNameExceeding100Characters_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand() with { FirstName = new string('A', 101) };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FirstName)
            .WithErrorMessage("First name must not exceed 100 characters.");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_WithEmptyLastName_ShouldFail(string? lastName)
    {
        // Arrange
        var command = CreateValidCommand() with { LastName = lastName ?? string.Empty };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.LastName)
            .WithErrorMessage("Last name is required.");
    }

    [Fact]
    public async Task Validate_WithLastNameExceeding100Characters_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand() with { LastName = new string('B', 101) };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.LastName)
            .WithErrorMessage("Last name must not exceed 100 characters.");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_WithEmptyEmail_ShouldFail(string? email)
    {
        // Arrange
        var command = CreateValidCommand() with { Email = email ?? string.Empty };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email is required.");
    }

    [Theory]
    [InlineData("invalid-email")]
    [InlineData("missing@")]
    [InlineData("@missing.com")]
    public async Task Validate_WithInvalidEmailFormat_ShouldFail(string email)
    {
        // Arrange
        var command = CreateValidCommand() with { Email = email };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("A valid email address is required.");
    }

    [Fact]
    public async Task Validate_WithDuplicateEmail_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand();
        _userIdentityServiceMock
            .Setup(x => x.EmailExistsAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("This email address is already in use.");
    }

    [Fact]
    public async Task Validate_WithWeakPassword_ShouldFail()
    {
        // Arrange — password missing uppercase, number, special char
        var command = CreateValidCommand() with { Password = "weak" };

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public async Task Validate_WithNonExistentRole_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand() with { Roles = ["NonExistentRole"] };
        _userIdentityServiceMock
            .Setup(x => x.RoleExistsAsync("NonExistentRole", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor("Roles[0]")
            .WithErrorMessage("Role 'NonExistentRole' does not exist.");
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
    public async Task Validate_WithMultipleInvalidRoles_ShouldReportAllErrors()
    {
        // Arrange
        var command = CreateValidCommand() with { Roles = ["BadRole1", "BadRole2"] };
        _userIdentityServiceMock
            .Setup(x => x.RoleExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _validator.TestValidateAsync(command);

        // Assert
        result.Errors.Where(e => e.PropertyName.StartsWith("Roles"))
            .Should().HaveCount(2);
    }
}
