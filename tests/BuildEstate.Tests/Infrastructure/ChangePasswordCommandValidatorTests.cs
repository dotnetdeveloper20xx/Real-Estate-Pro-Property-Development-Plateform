using BuildEstate.Application.Features.UserManagement.Authentication.Commands.ChangePassword;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.Infrastructure;

public class ChangePasswordCommandValidatorTests
{
    private readonly ChangePasswordCommandValidator _sut;

    public ChangePasswordCommandValidatorTests()
    {
        _sut = new ChangePasswordCommandValidator();
    }

    [Fact]
    public void Validate_WithValidCommand_HasNoErrors()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = "NewPassword2@",
            IpAddress = "192.168.1.1",
            CorrelationId = "corr-001"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithEmptyUserId_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "",
            CurrentPassword = "OldPassword1!",
            NewPassword = "NewPassword2@"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.UserId);
    }

    [Fact]
    public void Validate_WithEmptyCurrentPassword_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "",
            NewPassword = "NewPassword2@"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CurrentPassword);
    }

    [Fact]
    public void Validate_WithEmptyNewPassword_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = ""
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("New password is required.");
    }

    [Fact]
    public void Validate_WithShortPassword_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = "Ab1!"  // Only 4 chars — too short
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must be at least 8 characters.");
    }

    [Fact]
    public void Validate_WithTooLongPassword_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = new string('A', 129) + "1!" // 131 chars — too long
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must not exceed 128 characters.");
    }

    [Fact]
    public void Validate_WithNoUppercaseLetter_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = "newpassword1!" // no uppercase
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must contain at least 1 uppercase letter.");
    }

    [Fact]
    public void Validate_WithNoNumber_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = "NewPassword!" // no number
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must contain at least 1 number.");
    }

    [Fact]
    public void Validate_WithNoSpecialCharacter_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = "NewPassword1" // no special char
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("Password must contain at least 1 special character.");
    }

    [Fact]
    public void Validate_WithNewPasswordSameAsCurrentPassword_HasError()
    {
        // Arrange
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "SamePassword1!",
            NewPassword = "SamePassword1!"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
            .WithErrorMessage("New password must be different from the current password.");
    }

    [Fact]
    public void Validate_WithMultipleViolations_ReturnsAllErrors()
    {
        // Arrange — password has no uppercase, no number, no special char, and too short
        var command = new ChangePasswordCommand
        {
            UserId = "user-123",
            CurrentPassword = "OldPassword1!",
            NewPassword = "short"
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert — should have errors for length, uppercase, number, and special char
        var errors = result.Errors.Select(e => e.ErrorMessage).ToList();
        errors.Should().Contain("Password must be at least 8 characters.");
        errors.Should().Contain("Password must contain at least 1 uppercase letter.");
        errors.Should().Contain("Password must contain at least 1 number.");
        errors.Should().Contain("Password must contain at least 1 special character.");
    }
}
