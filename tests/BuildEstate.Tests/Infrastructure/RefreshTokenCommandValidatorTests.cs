using BuildEstate.Application.Features.UserManagement.Authentication.Commands.RefreshToken;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.Infrastructure;

public class RefreshTokenCommandValidatorTests
{
    private readonly RefreshTokenCommandValidator _validator;

    public RefreshTokenCommandValidatorTests()
    {
        _validator = new RefreshTokenCommandValidator();
    }

    [Fact]
    public void Validate_WithValidCommand_PassesValidation()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-refresh-token-string",
            IpAddress = "192.168.1.100",
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyRefreshToken_FailsValidation(string? refreshToken)
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = refreshToken ?? string.Empty,
            IpAddress = "192.168.1.1",
            UserAgent = "TestAgent/1.0"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.RefreshToken)
            .WithErrorMessage("Refresh token is required.");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyIpAddress_FailsValidation(string? ipAddress)
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-token",
            IpAddress = ipAddress ?? string.Empty,
            UserAgent = "TestAgent/1.0"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.IpAddress)
            .WithErrorMessage("IP address is required.");
    }

    [Fact]
    public void Validate_WithIpAddressExceedingMaxLength_FailsValidation()
    {
        // Arrange — IPv6 max is 45 chars; create a string exceeding that
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-token",
            IpAddress = new string('a', 46),
            UserAgent = "TestAgent/1.0"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.IpAddress)
            .WithErrorMessage("IP address must not exceed 45 characters.");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyUserAgent_FailsValidation(string? userAgent)
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-token",
            IpAddress = "10.0.0.1",
            UserAgent = userAgent ?? string.Empty
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.UserAgent)
            .WithErrorMessage("User agent is required.");
    }

    [Fact]
    public void Validate_WithUserAgentExceedingMaxLength_FailsValidation()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-token",
            IpAddress = "192.168.1.1",
            UserAgent = new string('x', 513)
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.UserAgent)
            .WithErrorMessage("User agent must not exceed 512 characters.");
    }

    [Fact]
    public void Validate_WithIpAddressAtMaxLength_PassesValidation()
    {
        // Arrange — IPv6 mapped address at exactly 45 characters
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-token",
            IpAddress = new string('a', 45),
            UserAgent = "TestAgent/1.0"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.IpAddress);
    }

    [Fact]
    public void Validate_WithUserAgentAtMaxLength_PassesValidation()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-token",
            IpAddress = "10.0.0.1",
            UserAgent = new string('x', 512)
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.UserAgent);
    }
}
