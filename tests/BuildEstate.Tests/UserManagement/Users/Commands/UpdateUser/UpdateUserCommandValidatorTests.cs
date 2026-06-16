using BuildEstate.Application.Features.UserManagement.Users.Commands.UpdateUser;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.UserManagement.Users.Commands.UpdateUser;

public class UpdateUserCommandValidatorTests
{
    private readonly UpdateUserCommandValidator _sut = new();

    private static UpdateUserCommand CreateValidCommand() => new()
    {
        UserId = "user-001",
        FirstName = "Jane",
        LastName = "Smith",
        Email = "jane.smith@example.com",
        Roles = new List<string> { "ProjectManager" },
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    #region Valid Command

    [Fact]
    public void Validate_WithValidCommand_HasNoErrors()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    #endregion

    #region UserId Validation

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WithEmptyUserId_HasValidationError(string? userId)
    {
        // Arrange
        var command = CreateValidCommand() with { UserId = userId ?? string.Empty };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.UserId)
            .WithErrorMessage("User ID is required.");
    }

    #endregion

    #region FirstName Validation

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WithEmptyFirstName_HasValidationError(string? firstName)
    {
        // Arrange
        var command = CreateValidCommand() with { FirstName = firstName ?? string.Empty };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FirstName)
            .WithErrorMessage("First name is required.");
    }

    [Fact]
    public void Validate_WithFirstNameExceeding100Chars_HasValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { FirstName = new string('A', 101) };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FirstName)
            .WithErrorMessage("First name must not exceed 100 characters.");
    }

    #endregion

    #region LastName Validation

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WithEmptyLastName_HasValidationError(string? lastName)
    {
        // Arrange
        var command = CreateValidCommand() with { LastName = lastName ?? string.Empty };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.LastName)
            .WithErrorMessage("Last name is required.");
    }

    [Fact]
    public void Validate_WithLastNameExceeding100Chars_HasValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { LastName = new string('B', 101) };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.LastName)
            .WithErrorMessage("Last name must not exceed 100 characters.");
    }

    #endregion

    #region Email Validation

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WithEmptyEmail_HasValidationError(string? email)
    {
        // Arrange
        var command = CreateValidCommand() with { Email = email ?? string.Empty };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    [InlineData("@nouser.com")]
    public void Validate_WithInvalidEmailFormat_HasValidationError(string email)
    {
        // Arrange
        var command = CreateValidCommand() with { Email = email };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validate_WithEmailExceeding256Chars_HasValidationError()
    {
        // Arrange — create a valid format email that exceeds max length
        var longEmail = new string('a', 250) + "@example.com"; // 262 chars, exceeds 256
        var command = CreateValidCommand() with { Email = longEmail };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email must not exceed 256 characters.");
    }

    #endregion

    #region Roles Validation

    [Fact]
    public void Validate_WithNullRoles_HasValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { Roles = null! };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Roles)
            .WithErrorMessage("Roles list is required.");
    }

    [Fact]
    public void Validate_WithEmptyRoles_HasNoErrors()
    {
        // Arrange — empty roles is valid (user can have no roles)
        var command = CreateValidCommand() with { Roles = new List<string>() };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Roles);
    }

    #endregion

    #region AdminUserId Validation

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WithEmptyAdminUserId_HasValidationError(string? adminUserId)
    {
        // Arrange
        var command = CreateValidCommand() with { AdminUserId = adminUserId ?? string.Empty };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.AdminUserId)
            .WithErrorMessage("Admin user ID is required.");
    }

    #endregion
}
