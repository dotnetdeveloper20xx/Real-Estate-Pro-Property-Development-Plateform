using BuildEstate.Application.Features.UserManagement.Validators;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.Infrastructure;

/// <summary>
/// Comprehensive unit tests for the reusable PasswordValidator.
/// Each individual rule is tested in isolation and in combination
/// to verify all violated rules are returned (not just the first).
/// </summary>
public class PasswordValidatorTests
{
    private readonly PasswordValidator _sut;

    public PasswordValidatorTests()
    {
        _sut = new PasswordValidator();
    }

    // ─── Valid Passwords ────────────────────────────────────────────────

    [Theory]
    [InlineData("Password1!")]
    [InlineData("Abcdefg1@")]
    [InlineData("MyP@ssw0rd")]
    [InlineData("Complex1$Password")]
    [InlineData("A1!bcdef")]              // Exactly 8 chars — minimum boundary
    public void Validate_WithValidPassword_HasNoErrors(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithMaxLengthValidPassword_HasNoErrors()
    {
        // Arrange — exactly 128 chars, meeting all requirements
        var password = "A1!" + new string('a', 125);

        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ─── Not Empty Rule ─────────────────────────────────────────────────

    [Fact]
    public void Validate_WithEmptyString_ReturnsRequiredError()
    {
        // Act
        var result = _sut.TestValidate(string.Empty);

        // Assert
        result.Errors.Should().Contain(e => e.ErrorMessage == "Password is required.");
    }

    [Fact]
    public void Validate_WithNullPassword_ThrowsArgumentNullException()
    {
        // FluentValidation does not allow null instances to be validated directly.
        // When used via SetValidator on a parent command, the parent validator 
        // handles null/empty checks before delegating to PasswordValidator.
        var action = () => _sut.TestValidate((string)null!);

        action.Should().Throw<ArgumentNullException>();
    }

    // ─── Minimum Length Rule ────────────────────────────────────────────

    [Theory]
    [InlineData("A1!")]          // 3 chars
    [InlineData("Ab1!")]         // 4 chars
    [InlineData("Ab1!cde")]      // 7 chars — one below minimum
    public void Validate_WithTooShortPassword_ReturnsMinLengthError(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().Contain(e =>
            e.ErrorMessage == "Password must be at least 8 characters.");
    }

    [Fact]
    public void Validate_WithExactly8Chars_DoesNotReturnMinLengthError()
    {
        // Arrange — exactly 8 chars meeting all other requirements
        var password = "Abcde1!x";

        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().NotContain(e =>
            e.ErrorMessage == "Password must be at least 8 characters.");
    }

    // ─── Maximum Length Rule ────────────────────────────────────────────

    [Fact]
    public void Validate_WithTooLongPassword_ReturnsMaxLengthError()
    {
        // Arrange — 129 chars
        var password = "A1!" + new string('a', 126);

        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().Contain(e =>
            e.ErrorMessage == "Password must not exceed 128 characters.");
    }

    [Fact]
    public void Validate_WithExactly128Chars_DoesNotReturnMaxLengthError()
    {
        // Arrange — exactly 128 chars
        var password = "A1!" + new string('a', 125);

        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().NotContain(e =>
            e.ErrorMessage == "Password must not exceed 128 characters.");
    }

    // ─── Uppercase Letter Rule ──────────────────────────────────────────

    [Theory]
    [InlineData("lowercase1!a")]        // No uppercase at all
    [InlineData("alllower123!")]        // No uppercase at all
    public void Validate_WithNoUppercase_ReturnsUppercaseError(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().Contain(e =>
            e.ErrorMessage == "Password must contain at least 1 uppercase letter.");
    }

    [Theory]
    [InlineData("Alowercase1!")]       // First char uppercase
    [InlineData("lowerCase1!a")]       // Middle uppercase
    [InlineData("lowercase1!A")]       // Last char uppercase
    public void Validate_WithUppercase_DoesNotReturnUppercaseError(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().NotContain(e =>
            e.ErrorMessage == "Password must contain at least 1 uppercase letter.");
    }

    // ─── Numeric Digit Rule ─────────────────────────────────────────────

    [Theory]
    [InlineData("NoNumbers!A")]         // No digits
    [InlineData("ALLUPPERCASE!")]       // No digits
    public void Validate_WithNoNumber_ReturnsNumberError(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().Contain(e =>
            e.ErrorMessage == "Password must contain at least 1 number.");
    }

    [Theory]
    [InlineData("0password!A")]        // Starts with digit
    [InlineData("passw5ord!A")]        // Middle digit
    [InlineData("password!A9")]        // Ends with digit
    public void Validate_WithNumber_DoesNotReturnNumberError(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().NotContain(e =>
            e.ErrorMessage == "Password must contain at least 1 number.");
    }

    // ─── Special Character Rule ─────────────────────────────────────────

    [Theory]
    [InlineData("NoSpecial1A")]         // No special chars
    [InlineData("JustAlphaNum123")]     // No special chars
    public void Validate_WithNoSpecialCharacter_ReturnsSpecialCharError(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().Contain(e =>
            e.ErrorMessage == "Password must contain at least 1 special character.");
    }

    [Theory]
    [InlineData("Password1!")]     // exclamation
    [InlineData("Password1@")]     // at sign
    [InlineData("Password1#")]     // hash
    [InlineData("Password1$")]     // dollar
    [InlineData("Password1%")]     // percent
    [InlineData("Password1^")]     // caret
    [InlineData("Password1&")]     // ampersand
    [InlineData("Password1*")]     // asterisk
    [InlineData("Password1(")]     // open paren
    [InlineData("Password1)")]     // close paren
    [InlineData("Password1-")]     // hyphen
    [InlineData("Password1_")]     // underscore
    [InlineData("Password1+")]     // plus
    [InlineData("Password1=")]     // equals
    [InlineData("Password1[")]     // open bracket
    [InlineData("Password1]")]     // close bracket
    [InlineData("Password1{")]     // open brace
    [InlineData("Password1}")]     // close brace
    [InlineData("Password1|")]     // pipe
    [InlineData("Password1;")]     // semicolon
    [InlineData("Password1:")]     // colon
    [InlineData("Password1'")]     // single quote
    [InlineData("Password1,")]     // comma
    [InlineData("Password1.")]     // period
    [InlineData("Password1<")]     // less than
    [InlineData("Password1>")]     // greater than
    [InlineData("Password1?")]     // question mark
    [InlineData("Password1/")]     // forward slash
    [InlineData("Password1`")]     // backtick
    [InlineData("Password1~")]     // tilde
    public void Validate_WithValidSpecialCharacter_DoesNotReturnSpecialCharError(string password)
    {
        // Act
        var result = _sut.TestValidate(password);

        // Assert
        result.Errors.Should().NotContain(e =>
            e.ErrorMessage == "Password must contain at least 1 special character.");
    }

    // ─── Multiple Violations ────────────────────────────────────────────

    [Fact]
    public void Validate_WithAllRulesViolated_ReturnsAllErrors()
    {
        // Arrange — "short" has no uppercase, no number, no special, too short
        var password = "short";

        // Act
        var result = _sut.TestValidate(password);

        // Assert — all policy rules should be violated
        var messages = result.Errors.Select(e => e.ErrorMessage).ToList();
        messages.Should().Contain("Password must be at least 8 characters.");
        messages.Should().Contain("Password must contain at least 1 uppercase letter.");
        messages.Should().Contain("Password must contain at least 1 number.");
        messages.Should().Contain("Password must contain at least 1 special character.");
    }

    [Fact]
    public void Validate_WithMissingUppercaseAndNumber_ReturnsBothErrors()
    {
        // Arrange — meets length, has special char, but no uppercase and no number
        var password = "lowercase!pw";

        // Act
        var result = _sut.TestValidate(password);

        // Assert
        var messages = result.Errors.Select(e => e.ErrorMessage).ToList();
        messages.Should().Contain("Password must contain at least 1 uppercase letter.");
        messages.Should().Contain("Password must contain at least 1 number.");
        messages.Should().NotContain("Password must be at least 8 characters.");
        messages.Should().NotContain("Password must not exceed 128 characters.");
        messages.Should().NotContain("Password must contain at least 1 special character.");
    }

    [Fact]
    public void Validate_WithMissingNumberAndSpecialChar_ReturnsBothErrors()
    {
        // Arrange — meets length, has uppercase, but no number and no special
        var password = "Uppercase";

        // Act
        var result = _sut.TestValidate(password);

        // Assert
        var messages = result.Errors.Select(e => e.ErrorMessage).ToList();
        messages.Should().Contain("Password must contain at least 1 number.");
        messages.Should().Contain("Password must contain at least 1 special character.");
        messages.Should().NotContain("Password must be at least 8 characters.");
        messages.Should().NotContain("Password must contain at least 1 uppercase letter.");
    }

    [Fact]
    public void Validate_WithOnlyLengthViolation_ReturnsOnlyLengthError()
    {
        // Arrange — 7 chars but meets all other rules
        var password = "Abc1!xy";

        // Act
        var result = _sut.TestValidate(password);

        // Assert
        var messages = result.Errors.Select(e => e.ErrorMessage).ToList();
        messages.Should().Contain("Password must be at least 8 characters.");
        messages.Should().HaveCount(1);
    }

    // ─── CascadeMode Verification ──────────────────────────────────────

    [Fact]
    public void Validate_ReturnsAllViolations_NotJustFirst()
    {
        // Arrange — violates length, uppercase, number, and special char
        var password = "ab";

        // Act
        var result = _sut.TestValidate(password);

        // Assert — at least 4 errors should be present (length + uppercase + number + special)
        result.Errors.Count.Should().BeGreaterThanOrEqualTo(4);
    }
}
