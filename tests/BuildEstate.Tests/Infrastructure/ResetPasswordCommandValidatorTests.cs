using BuildEstate.Application.Features.UserManagement.Users.Commands.ResetPassword;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.Infrastructure;

public class ResetPasswordCommandValidatorTests
{
    private readonly ResetPasswordCommandValidator _sut = new();

    private static ResetPasswordCommand CreateValidCommand() => new()
    {
        UserId = "user-456",
        NewPassword = "ValidPass1!",
        AdminUserId = "admin-123",
        AdminUserName = "Jane Admin",
        IpAddress = "10.0.0.1",
        CorrelationId = "corr-001"
    };

    [Fact]
    public async Task Validate_WithValidCommand_PassesValidation()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Validate_WithEmptyUserId_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { UserId = "" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.UserId)
            .WithErrorMessage("User ID is required.");
    }

    [Fact]
    public async Task Validate_WithEmptyAdminUserId_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { AdminUserId = "" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.AdminUserId)
            .WithErrorMessage("Admin User ID is required.");
    }

    [Fact]
    public async Task Validate_WithEmptyAdminUserName_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { AdminUserName = "" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.AdminUserName)
            .WithErrorMessage("Admin User Name is required.");
    }

    [Fact]
    public async Task Validate_WithEmptyPassword_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { NewPassword = "" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("New password is required.");
    }

    [Fact]
    public async Task Validate_WithTooShortPassword_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { NewPassword = "Ab1!" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must be at least 8 characters.");
    }

    [Fact]
    public async Task Validate_WithNoUppercaseLetter_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { NewPassword = "lowercase1!" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must contain at least 1 uppercase letter.");
    }

    [Fact]
    public async Task Validate_WithNoNumber_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { NewPassword = "NoNumber!" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must contain at least 1 number.");
    }

    [Fact]
    public async Task Validate_WithNoSpecialCharacter_FailsValidation()
    {
        // Arrange
        var command = CreateValidCommand() with { NewPassword = "NoSpecial1" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must contain at least 1 special character.");
    }

    [Fact]
    public async Task Validate_WithMultipleViolations_ReturnsAllErrors()
    {
        // Arrange — password too short, no uppercase, no number, no special char
        var command = CreateValidCommand() with { NewPassword = "abc" };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.Errors.Should().HaveCountGreaterThanOrEqualTo(4);
        result.ShouldHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public async Task Validate_WithMaxLengthExceeded_FailsValidation()
    {
        // Arrange — 129 characters
        var command = CreateValidCommand() with { NewPassword = "A1!" + new string('a', 126) };

        // Act
        var result = await _sut.TestValidateAsync(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must not exceed 128 characters.");
    }
}
