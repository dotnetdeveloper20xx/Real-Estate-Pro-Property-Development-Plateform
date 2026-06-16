using BuildEstate.Application.Features.UserManagement.Authentication.Commands.Login;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.Infrastructure;

public class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _sut;

    public LoginCommandValidatorTests()
    {
        _sut = new LoginCommandValidator();
    }

    [Fact]
    public void Validate_WithValidCommand_ShouldPassValidation()
    {
        // Arrange
        var command = new LoginCommand
        {
            Email = "user@example.com",
            Password = "SecureP@ss1"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WithEmptyEmail_ShouldFail(string? email)
    {
        // Arrange
        var command = new LoginCommand
        {
            Email = email ?? string.Empty,
            Password = "ValidPass1!"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email is required.");
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    [InlineData("@nodomain")]
    [InlineData("no-at-sign.com")]
    public void Validate_WithInvalidEmailFormat_ShouldFail(string email)
    {
        // Arrange
        var command = new LoginCommand
        {
            Email = email,
            Password = "ValidPass1!"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WithEmptyPassword_ShouldFail(string? password)
    {
        // Arrange
        var command = new LoginCommand
        {
            Email = "user@example.com",
            Password = password ?? string.Empty
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password is required.");
    }

    [Fact]
    public void Validate_WithBothFieldsEmpty_ShouldReturnMultipleErrors()
    {
        // Arrange
        var command = new LoginCommand
        {
            Email = string.Empty,
            Password = string.Empty
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Validate_WithValidEmailAndPassword_ShouldNotValidatePasswordStrength()
    {
        // Login validator only checks non-empty, not password policy strength
        var command = new LoginCommand
        {
            Email = "user@example.com",
            Password = "a" // weak but acceptable at login time
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Password);
    }
}
