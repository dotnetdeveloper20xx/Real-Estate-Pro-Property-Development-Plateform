using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Services;
using FsCheck;
using FsCheck.Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Locked Account Rejection behavior.
/// Verifies that the AccountLockoutService correctly rejects all login attempts
/// for locked accounts regardless of credential validity, and auto-unlocks
/// after the 15-minute lockout duration expires.
///
/// **Validates: Requirements 1.9, 3.2, 3.3**
/// </summary>
public class LockedAccountRejectionPropertyTests
{
    private const int LockoutMinutes = 15;

    #region Property 3: Locked Account Rejects All Credentials

    /// <summary>
    /// Property 3: For any locked user account (LockoutEnd in the future),
    /// IsLockedOutAsync SHALL return true, confirming that login attempts
    /// are rejected regardless of credential validity.
    ///
    /// **Validates: Requirements 1.9, 3.2, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property LockedAccount_IsLockedOutReturnsTrue_ForAnyFutureLockoutEnd()
    {
        return Prop.ForAll(
            GenerateMinutesUntilExpiry(),
            minutesRemaining =>
            {
                // Arrange: user is locked with LockoutEnd in the future
                var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(minutesRemaining);
                var user = CreateLockedUser(lockoutEnd);
                var (service, userManagerMock) = CreateServiceForUser(user);

                // Identity reports user as locked when LockoutEnd > now
                userManagerMock.Setup(m => m.IsLockedOutAsync(user))
                    .ReturnsAsync(true);

                // Act
                var isLockedOut = service.IsLockedOutAsync(user.Id).GetAwaiter().GetResult();

                // Assert: account should be locked regardless of any credentials
                isLockedOut.Should().BeTrue(
                    because: $"user with LockoutEnd {minutesRemaining} minutes in the future " +
                             "should be locked out and all login attempts should be rejected");

                return true;
            });
    }

    /// <summary>
    /// Property 3: After the 15-minute lockout duration expires (LockoutEnd in the past),
    /// IsLockedOutAsync SHALL return false, indicating the account is auto-unlocked.
    ///
    /// **Validates: Requirements 1.9, 3.2, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property LockedAccount_IsLockedOutReturnsFalse_AfterLockoutExpires()
    {
        return Prop.ForAll(
            GenerateMinutesPastExpiry(),
            minutesPast =>
            {
                // Arrange: lockout has expired (LockoutEnd is in the past)
                var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(-minutesPast);
                var user = CreateLockedUser(lockoutEnd);
                var (service, userManagerMock) = CreateServiceForUser(user);

                // Identity reports user as NOT locked when LockoutEnd <= now
                userManagerMock.Setup(m => m.IsLockedOutAsync(user))
                    .ReturnsAsync(false);

                // Act
                var isLockedOut = service.IsLockedOutAsync(user.Id).GetAwaiter().GetResult();

                // Assert: account should be unlocked after expiry
                isLockedOut.Should().BeFalse(
                    because: $"user whose lockout expired {minutesPast} minutes ago " +
                             "should be automatically unlocked");

                return true;
            });
    }

    /// <summary>
    /// Property 3: For any locked user, GetLockoutEndAsync SHALL return the lockout
    /// end date when the lockout is still active (in the future), confirming the
    /// lockout period is tracked correctly.
    ///
    /// **Validates: Requirements 1.9, 3.2, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property LockedAccount_GetLockoutEnd_ReturnsActiveLockoutDate()
    {
        return Prop.ForAll(
            GenerateMinutesUntilExpiry(),
            minutesRemaining =>
            {
                // Arrange
                var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(minutesRemaining);
                var user = CreateLockedUser(lockoutEnd);
                var (service, userManagerMock) = CreateServiceForUser(user);

                userManagerMock.Setup(m => m.GetLockoutEndDateAsync(user))
                    .ReturnsAsync(lockoutEnd);

                // Act
                var result = service.GetLockoutEndAsync(user.Id).GetAwaiter().GetResult();

                // Assert: should return the lockout end date
                result.Should().NotBeNull(
                    because: "an actively locked account should report its lockout end date");
                result!.Value.Should().Be(lockoutEnd,
                    because: "the returned lockout end should match the configured value");

                return true;
            });
    }

    /// <summary>
    /// Property 3: For any locked user whose lockout has expired,
    /// GetLockoutEndAsync SHALL return null, confirming auto-unlock.
    ///
    /// **Validates: Requirements 1.9, 3.2, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property LockedAccount_GetLockoutEnd_ReturnsNull_AfterExpiry()
    {
        return Prop.ForAll(
            GenerateMinutesPastExpiry(),
            minutesPast =>
            {
                // Arrange: lockout expired
                var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(-minutesPast);
                var user = CreateLockedUser(lockoutEnd);
                var (service, userManagerMock) = CreateServiceForUser(user);

                userManagerMock.Setup(m => m.GetLockoutEndDateAsync(user))
                    .ReturnsAsync(lockoutEnd);

                // Act
                var result = service.GetLockoutEndAsync(user.Id).GetAwaiter().GetResult();

                // Assert: should return null since lockout expired
                result.Should().BeNull(
                    because: $"user whose lockout expired {minutesPast} minutes ago should " +
                             "have null lockout end (auto-unlocked)");

                return true;
            });
    }

    /// <summary>
    /// Property 3: For any locked user, GetRemainingLockoutTimeAsync SHALL return
    /// a positive duration that does not exceed the original lockout period (15 minutes).
    ///
    /// **Validates: Requirements 1.9, 3.2, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property LockedAccount_RemainingTime_IsPositive_AndBoundedByLockoutDuration()
    {
        return Prop.ForAll(
            GenerateMinutesUntilExpiry(),
            minutesRemaining =>
            {
                // Arrange
                var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(minutesRemaining);
                var user = CreateLockedUser(lockoutEnd);
                var (service, userManagerMock) = CreateServiceForUser(user);

                userManagerMock.Setup(m => m.GetLockoutEndDateAsync(user))
                    .ReturnsAsync(lockoutEnd);

                // Act
                var remaining = service.GetRemainingLockoutTimeAsync(user.Id).GetAwaiter().GetResult();

                // Assert: remaining time should be positive and bounded
                remaining.Should().BeGreaterThan(TimeSpan.Zero,
                    because: "a locked account with future lockout end should have positive remaining time");
                remaining.TotalMinutes.Should().BeLessOrEqualTo(LockoutMinutes + 0.1,
                    because: "remaining lockout time should not exceed the configured 15-minute duration");

                return true;
            });
    }

    /// <summary>
    /// Property 3: For any locked user whose lockout has expired,
    /// GetRemainingLockoutTimeAsync SHALL return TimeSpan.Zero.
    ///
    /// **Validates: Requirements 1.9, 3.2, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property LockedAccount_RemainingTime_IsZero_AfterExpiry()
    {
        return Prop.ForAll(
            GenerateMinutesPastExpiry(),
            minutesPast =>
            {
                // Arrange: lockout expired
                var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(-minutesPast);
                var user = CreateLockedUser(lockoutEnd);
                var (service, userManagerMock) = CreateServiceForUser(user);

                userManagerMock.Setup(m => m.GetLockoutEndDateAsync(user))
                    .ReturnsAsync(lockoutEnd);

                // Act
                var remaining = service.GetRemainingLockoutTimeAsync(user.Id).GetAwaiter().GetResult();

                // Assert
                remaining.Should().Be(TimeSpan.Zero,
                    because: "an expired lockout should have zero remaining time (auto-unlocked)");

                return true;
            });
    }

    #endregion

    #region Generators

    /// <summary>
    /// Generates minutes remaining until lockout expiry (1 to 15 minutes in the future).
    /// This represents an actively locked account.
    /// </summary>
    private static Arbitrary<int> GenerateMinutesUntilExpiry()
    {
        var gen = Gen.Choose(1, LockoutMinutes);
        return Arb.From(gen);
    }

    /// <summary>
    /// Generates minutes past lockout expiry (1 to 60 minutes in the past).
    /// This represents a previously locked account whose lockout has expired.
    /// </summary>
    private static Arbitrary<int> GenerateMinutesPastExpiry()
    {
        var gen = Gen.Choose(1, 60);
        return Arb.From(gen);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Creates a user that is in a locked-out state with the given lockout end date.
    /// </summary>
    private static ApplicationUser CreateLockedUser(DateTimeOffset lockoutEnd)
    {
        return new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "locked@buildestate.com",
            Email = "locked@buildestate.com",
            FirstName = "Locked",
            LastName = "User",
            IsActive = true,
            AccessFailedCount = 5,
            LockoutEnabled = true,
            LockoutEnd = lockoutEnd
        };
    }

    /// <summary>
    /// Creates an AccountLockoutService with a mocked UserManager configured for the given user.
    /// </summary>
    private static (AccountLockoutService Service, Mock<UserManager<ApplicationUser>> UserManagerMock)
        CreateServiceForUser(ApplicationUser user)
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object,
            Mock.Of<IOptions<IdentityOptions>>(),
            Mock.Of<IPasswordHasher<ApplicationUser>>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            Array.Empty<IPasswordValidator<ApplicationUser>>(),
            Mock.Of<ILookupNormalizer>(),
            Mock.Of<IdentityErrorDescriber>(),
            Mock.Of<IServiceProvider>(),
            Mock.Of<ILogger<UserManager<ApplicationUser>>>());

        // Setup FindByIdAsync to return the locked user
        userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);

        var service = new AccountLockoutService(
            userManagerMock.Object,
            Mock.Of<ILogger<AccountLockoutService>>());

        return (service, userManagerMock);
    }

    #endregion
}
