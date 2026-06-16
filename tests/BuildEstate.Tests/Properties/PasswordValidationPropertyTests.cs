using BuildEstate.Application.Features.UserManagement.Validators;
using FluentAssertions;
using FluentValidation;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Password Validation (Property 4).
///
/// Property 4: Password Validation Identifies All Violated Rules
/// For any string input, the password validator SHALL correctly identify each individual
/// policy rule that is violated (minimum length, maximum length, uppercase requirement,
/// numeric requirement, special character requirement), returning the complete set of
/// unmet requirements without false positives.
///
/// **Validates: Requirements 4.10, 7.2, 7.3, 17.1, 17.2, 17.3, 17.4**
/// </summary>
public class PasswordValidationPropertyTests
{
    private static readonly PasswordValidator Validator = new();

    private const string MinLengthMessage = "Password must be at least 8 characters.";
    private const string MaxLengthMessage = "Password must not exceed 128 characters.";
    private const string UppercaseMessage = "Password must contain at least 1 uppercase letter.";
    private const string NumberMessage = "Password must contain at least 1 number.";
    private const string SpecialCharMessage = "Password must contain at least 1 special character.";

    private static readonly string SpecialChars = "!@#$%^&*()-_+=[]{}|;:',.<>?/`~";

    #region Property 4.1: Short passwords trigger minimum length rule

    /// <summary>
    /// Property 4.1: For any non-empty string shorter than 8 characters,
    /// the "minimum 8 characters" rule is violated.
    ///
    /// **Validates: Requirements 17.1**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ShortPassword_ViolatesMinimumLengthRule()
    {
        // Generate non-empty strings of length 1 to 7
        var shortPasswordGen = from len in Gen.Choose(1, 7)
                               from chars in Gen.ArrayOf(len, Gen.Elements(
                                   "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
                                       .ToCharArray()))
                               select new string(chars);

        return Prop.ForAll(
            shortPasswordGen.ToArbitrary(),
            password =>
            {
                var result = Validator.Validate(password);
                var messages = result.Errors.Select(e => e.ErrorMessage).ToList();

                return messages.Contains(MinLengthMessage)
                    .Label($"Password '{password}' (length {password.Length}) should violate min length rule");
            });
    }

    #endregion

    #region Property 4.2: Long passwords trigger maximum length rule

    /// <summary>
    /// Property 4.2: For any string longer than 128 characters,
    /// the "maximum 128 characters" rule is violated.
    ///
    /// **Validates: Requirements 17.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property LongPassword_ViolatesMaximumLengthRule()
    {
        // Generate strings of length 129 to 200
        var longPasswordGen = from len in Gen.Choose(129, 200)
                              from chars in Gen.ArrayOf(len, Gen.Elements(
                                  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#"
                                      .ToCharArray()))
                              select new string(chars);

        return Prop.ForAll(
            longPasswordGen.ToArbitrary(),
            password =>
            {
                var result = Validator.Validate(password);
                var messages = result.Errors.Select(e => e.ErrorMessage).ToList();

                return messages.Contains(MaxLengthMessage)
                    .Label($"Password of length {password.Length} should violate max length rule");
            });
    }

    #endregion

    #region Property 4.3: No uppercase letter triggers uppercase rule

    /// <summary>
    /// Property 4.3: For any string with no uppercase letter,
    /// the "uppercase" rule is violated.
    ///
    /// **Validates: Requirements 17.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NoUppercase_ViolatesUppercaseRule()
    {
        // Generate non-empty strings that contain no uppercase letters (length 8-20 to avoid min-length noise)
        var noUpperGen = from len in Gen.Choose(8, 20)
                         from chars in Gen.ArrayOf(len, Gen.Elements(
                             "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
                                 .ToCharArray()))
                         select new string(chars);

        return Prop.ForAll(
            noUpperGen.ToArbitrary(),
            password =>
            {
                var result = Validator.Validate(password);
                var messages = result.Errors.Select(e => e.ErrorMessage).ToList();

                return messages.Contains(UppercaseMessage)
                    .Label($"Password '{password}' with no uppercase should violate uppercase rule");
            });
    }

    #endregion

    #region Property 4.4: No digit triggers number rule

    /// <summary>
    /// Property 4.4: For any string with no digit,
    /// the "number" rule is violated.
    ///
    /// **Validates: Requirements 17.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NoDigit_ViolatesNumberRule()
    {
        // Generate non-empty strings that contain no digits (length 8-20)
        var noDigitGen = from len in Gen.Choose(8, 20)
                         from chars in Gen.ArrayOf(len, Gen.Elements(
                             "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*"
                                 .ToCharArray()))
                         select new string(chars);

        return Prop.ForAll(
            noDigitGen.ToArbitrary(),
            password =>
            {
                var result = Validator.Validate(password);
                var messages = result.Errors.Select(e => e.ErrorMessage).ToList();

                return messages.Contains(NumberMessage)
                    .Label($"Password '{password}' with no digit should violate number rule");
            });
    }

    #endregion

    #region Property 4.5: No special character triggers special character rule

    /// <summary>
    /// Property 4.5: For any string with no special character,
    /// the "special character" rule is violated.
    ///
    /// **Validates: Requirements 17.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NoSpecialChar_ViolatesSpecialCharacterRule()
    {
        // Generate non-empty strings that contain no special characters (length 8-20)
        var noSpecialGen = from len in Gen.Choose(8, 20)
                           from chars in Gen.ArrayOf(len, Gen.Elements(
                               "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                   .ToCharArray()))
                           select new string(chars);

        return Prop.ForAll(
            noSpecialGen.ToArbitrary(),
            password =>
            {
                var result = Validator.Validate(password);
                var messages = result.Errors.Select(e => e.ErrorMessage).ToList();

                return messages.Contains(SpecialCharMessage)
                    .Label($"Password '{password}' with no special char should violate special character rule");
            });
    }

    #endregion

    #region Property 4.6: Valid passwords produce no violations (no false positives)

    /// <summary>
    /// Property 4.6: For any string that meets ALL requirements
    /// (8-128 chars, has uppercase, has digit, has special char), no rules are violated.
    ///
    /// **Validates: Requirements 4.10, 7.2, 7.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ValidPassword_ProducesNoViolations()
    {
        // Generate passwords that meet ALL requirements:
        // - Length 8 to 128
        // - Contains at least 1 uppercase
        // - Contains at least 1 digit
        // - Contains at least 1 special character
        var validPasswordGen = from paddingLen in Gen.Choose(5, 50)
                               from upper in Gen.Elements("ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray())
                               from digit in Gen.Elements("0123456789".ToCharArray())
                               from special in Gen.Elements(SpecialChars.ToCharArray())
                               from padding in Gen.ArrayOf(paddingLen, Gen.Elements(
                                   "abcdefghijklmnopqrstuvwxyz".ToCharArray()))
                               select new string(new[] { upper, digit, special }.Concat(padding).ToArray());

        return Prop.ForAll(
            validPasswordGen.ToArbitrary(),
            password =>
            {
                var result = Validator.Validate(password);
                var passwordRuleMessages = result.Errors
                    .Select(e => e.ErrorMessage)
                    .Where(m => m != "Password is required.") // Exclude empty check
                    .ToList();

                return (passwordRuleMessages.Count == 0)
                    .Label($"Valid password '{password}' (length {password.Length}) should produce no violations but got: [{string.Join(", ", passwordRuleMessages)}]");
            });
    }

    #endregion

    #region Property 4.7: Multiple violations are all reported (not just the first)

    /// <summary>
    /// Property 4.7: For any string violating multiple rules,
    /// ALL violated rules are reported (not just the first).
    ///
    /// **Validates: Requirements 4.10, 7.2, 7.3, 17.1, 17.2, 17.3, 17.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property MultipleViolations_AllReported()
    {
        // Generate short strings (1-7 chars) using only lowercase letters
        // This violates: min length, uppercase, number, and special character rules (4 rules)
        var multiViolationGen = from len in Gen.Choose(1, 7)
                                from chars in Gen.ArrayOf(len, Gen.Elements(
                                    "abcdefghijklmnopqrstuvwxyz".ToCharArray()))
                                select new string(chars);

        return Prop.ForAll(
            multiViolationGen.ToArbitrary(),
            password =>
            {
                var result = Validator.Validate(password);
                var messages = result.Errors.Select(e => e.ErrorMessage).ToList();

                // These passwords violate at least 4 rules: min length, uppercase, number, special char
                var hasMinLength = messages.Contains(MinLengthMessage);
                var hasUppercase = messages.Contains(UppercaseMessage);
                var hasNumber = messages.Contains(NumberMessage);
                var hasSpecial = messages.Contains(SpecialCharMessage);

                return (hasMinLength && hasUppercase && hasNumber && hasSpecial)
                    .Label($"Password '{password}' should violate min-length, uppercase, number, and special char rules. Got: [{string.Join(", ", messages)}]");
            });
    }

    #endregion
}
