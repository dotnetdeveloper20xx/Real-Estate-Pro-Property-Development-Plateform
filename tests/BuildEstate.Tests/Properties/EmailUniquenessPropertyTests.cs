using BuildEstate.Application.Features.UserManagement.Users.Commands.CreateUser;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Email Uniqueness (Property 6).
///
/// Property 6: Email Uniqueness Constraint
/// For any email address that already exists in the system, attempting to create a new user
/// with that same email SHALL be rejected with a validation error indicating the email is
/// already in use.
///
/// **Validates: Requirements 4.4**
/// </summary>
public class EmailUniquenessPropertyTests
{
    private const string EmailAlreadyInUseMessage = "This email address is already in use.";

    /// <summary>
    /// Creates a validator where the given email is configured to already exist.
    /// </summary>
    private static CreateUserCommandValidator CreateValidatorWithExistingEmail(string existingEmail)
    {
        var mock = new Mock<IUserIdentityService>();

        // The specific email already exists
        mock.Setup(x => x.EmailExistsAsync(existingEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // All other emails do not exist
        mock.Setup(x => x.EmailExistsAsync(It.Is<string>(e => e != existingEmail), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // All roles exist (to avoid role validation noise)
        mock.Setup(x => x.RoleExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        return new CreateUserCommandValidator(mock.Object);
    }

    /// <summary>
    /// Creates a validator where no emails exist in the system.
    /// </summary>
    private static CreateUserCommandValidator CreateValidatorWithNoExistingEmails()
    {
        var mock = new Mock<IUserIdentityService>();

        mock.Setup(x => x.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        mock.Setup(x => x.RoleExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        return new CreateUserCommandValidator(mock.Object);
    }

    /// <summary>
    /// Generates a valid CreateUserCommand with the specified email.
    /// All other fields satisfy their respective validation rules.
    /// </summary>
    private static CreateUserCommand CreateValidCommandWithEmail(string email) => new()
    {
        FirstName = "Test",
        LastName = "User",
        Email = email,
        Password = "SecureP@ss1",
        Roles = ["ProjectManager"],
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    /// <summary>
    /// Generator for valid email strings in the format local@domain.tld.
    /// </summary>
    private static Arbitrary<string> ValidEmailArbitrary()
    {
        var emailGen = from localLen in Gen.Choose(3, 15)
                       from localChars in Gen.ArrayOf(localLen, Gen.Elements(
                           "abcdefghijklmnopqrstuvwxyz0123456789".ToCharArray()))
                       from domainLen in Gen.Choose(3, 10)
                       from domainChars in Gen.ArrayOf(domainLen, Gen.Elements(
                           "abcdefghijklmnopqrstuvwxyz".ToCharArray()))
                       from tld in Gen.Elements("com", "co.uk", "org", "net", "io")
                       select $"{new string(localChars)}@{new string(domainChars)}.{tld}";

        return emailGen.ToArbitrary();
    }

    #region Property 6.1: Existing email is rejected with validation error

    /// <summary>
    /// Property 6.1: For any valid email that already exists in the system,
    /// creating a user with that email SHALL produce a validation error
    /// with message "This email address is already in use."
    ///
    /// **Validates: Requirements 4.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ExistingEmail_IsRejectedWithUniquenesError()
    {
        return Prop.ForAll(
            ValidEmailArbitrary(),
            email =>
            {
                // Arrange: configure the email as already existing
                var validator = CreateValidatorWithExistingEmail(email);
                var command = CreateValidCommandWithEmail(email);

                // Act
                var result = validator.ValidateAsync(command).GetAwaiter().GetResult();

                // Assert: should have the uniqueness error on Email property
                var emailErrors = result.Errors
                    .Where(e => e.PropertyName == "Email")
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return emailErrors.Contains(EmailAlreadyInUseMessage)
                    .Label($"Email '{email}' already exists but validator did not produce uniqueness error. Errors: [{string.Join(", ", emailErrors)}]");
            });
    }

    #endregion

    #region Property 6.2: Non-existing email does not produce uniqueness error

    /// <summary>
    /// Property 6.2: For any valid email that does NOT exist in the system,
    /// the validator SHALL NOT produce an email uniqueness error.
    ///
    /// **Validates: Requirements 4.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NonExistingEmail_DoesNotProduceUniquenessError()
    {
        return Prop.ForAll(
            ValidEmailArbitrary(),
            email =>
            {
                // Arrange: no emails exist in the system
                var validator = CreateValidatorWithNoExistingEmails();
                var command = CreateValidCommandWithEmail(email);

                // Act
                var result = validator.ValidateAsync(command).GetAwaiter().GetResult();

                // Assert: should NOT have the uniqueness error
                var emailUniquenessErrors = result.Errors
                    .Where(e => e.PropertyName == "Email" &&
                                e.ErrorMessage == EmailAlreadyInUseMessage)
                    .ToList();

                return (emailUniquenessErrors.Count == 0)
                    .Label($"Email '{email}' does not exist but validator produced uniqueness error");
            });
    }

    #endregion
}
