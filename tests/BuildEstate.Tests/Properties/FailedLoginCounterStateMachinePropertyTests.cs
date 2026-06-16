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
/// Property-based tests for the Failed Login Attempt Counter State Machine.
/// Verifies that AccountLockoutService correctly manages the state machine:
/// - Starting from 0, each failure increments by 1
/// - At exactly 5 failures, the account becomes locked
/// - A successful login at any count &lt; 5 resets to 0
///
/// **Validates: Requirements 1.2, 1.7, 3.1, 3.4**
/// </summary>
public class FailedLoginCounterStateMachinePropertyTests
{
    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;

    #region Property 2: Failed Login Attempt Counter State Machine

    /// <summary>
    /// Property 2: For any user with fewer than 5 failed attempts, a failed login attempt
    /// increments the counter by exactly 1. When the count reaches exactly 5,
    /// the account transitions to locked status.
    ///
    /// **Validates: Requirements 1.2, 1.7, 3.1, 3.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property FailedAttempt_IncrementsCounterByOne_AndLocksAtFive()
    {
        return Prop.ForAll(
            GenerateInitialFailedCount(),
            initialCount =>
            {
                // Arrange
                var (service, userManagerMock, user) = CreateServiceWithFailedCount(initialCount);

                // Track the state after AccessFailedAsync is called
                var countAfterIncrement = initialCount + 1;
                var shouldLock = countAfterIncrement >= MaxFailedAttempts;

                // Setup: AccessFailedAsync succeeds and increments the count
                userManagerMock.Setup(m => m.AccessFailedAsync(user))
                    .ReturnsAsync(IdentityResult.Success)
                    .Callback(() =>
                    {
                        // Simulate Identity incrementing the count
                        user.AccessFailedCount = countAfterIncrement;
                        if (shouldLock)
                        {
                            user.LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(LockoutMinutes);
                        }
                    });

                // After increment, the count reflects the new value
                userManagerMock.Setup(m => m.GetAccessFailedCountAsync(user))
                    .ReturnsAsync(countAfterIncrement);

                // IsLockedOut depends on whether we reached the threshold
                userManagerMock.Setup(m => m.IsLockedOutAsync(user))
                    .ReturnsAsync(shouldLock);

                // Act
                var isLockedOut = service.IncrementFailedAttemptsAsync(user.Id).GetAwaiter().GetResult();

                // Assert
                isLockedOut.Should().Be(shouldLock,
                    because: $"with initial count {initialCount}, after increment count is {countAfterIncrement}, " +
                             $"lockout should be {shouldLock}");

                // Verify AccessFailedAsync was called exactly once
                userManagerMock.Verify(m => m.AccessFailedAsync(user), Times.Once);

                return true;
            });
    }

    /// <summary>
    /// Property 2 (complementary): A successful login at any failed count below 5
    /// resets the counter to zero.
    ///
    /// **Validates: Requirements 1.2, 1.7, 3.1, 3.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property SuccessfulLogin_ResetsCounterToZero_WhenBelowThreshold()
    {
        return Prop.ForAll(
            GenerateInitialFailedCount(),
            initialCount =>
            {
                // Arrange
                var (service, userManagerMock, user) = CreateServiceWithFailedCount(initialCount);

                // Setup: ResetAccessFailedCountAsync succeeds
                userManagerMock.Setup(m => m.ResetAccessFailedCountAsync(user))
                    .ReturnsAsync(IdentityResult.Success)
                    .Callback(() =>
                    {
                        user.AccessFailedCount = 0;
                    });

                // Act
                var action = () => service.ResetFailedAttemptsAsync(user.Id);
                action.Should().NotThrowAsync().GetAwaiter().GetResult();

                // Assert: counter is reset to 0
                user.AccessFailedCount.Should().Be(0,
                    because: $"a successful login should reset the counter from {initialCount} to 0");

                // Verify ResetAccessFailedCountAsync was called exactly once
                userManagerMock.Verify(m => m.ResetAccessFailedCountAsync(user), Times.Once);

                return true;
            });
    }

    /// <summary>
    /// Property 2 (state machine sequence): For any sequence of consecutive failures
    /// starting from 0, the counter increments monotonically by 1 each time,
    /// and lockout occurs precisely when the count reaches 5.
    ///
    /// **Validates: Requirements 1.2, 1.7, 3.1, 3.4**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ConsecutiveFailures_IncrementMonotonically_LockAtFive()
    {
        return Prop.ForAll(
            GenerateFailureSequenceLength(),
            sequenceLength =>
            {
                // Arrange: start from 0 failed attempts
                var user = CreateTestUser(failedCount: 0);
                var userManagerMock = CreateUserManagerMock(user);
                var service = new AccountLockoutService(
                    userManagerMock.Object,
                    Mock.Of<ILogger<AccountLockoutService>>());

                var currentCount = 0;
                var lockedOutResult = false;

                // Setup dynamic behavior that tracks state across calls
                userManagerMock.Setup(m => m.GetLockoutEnabledAsync(user))
                    .ReturnsAsync(true);

                userManagerMock.Setup(m => m.AccessFailedAsync(user))
                    .ReturnsAsync(IdentityResult.Success)
                    .Callback(() =>
                    {
                        currentCount++;
                        user.AccessFailedCount = currentCount;
                        if (currentCount >= MaxFailedAttempts)
                        {
                            user.LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(LockoutMinutes);
                        }
                    });

                userManagerMock.Setup(m => m.GetAccessFailedCountAsync(user))
                    .Returns(() => Task.FromResult(currentCount));

                userManagerMock.Setup(m => m.IsLockedOutAsync(user))
                    .Returns(() => Task.FromResult(currentCount >= MaxFailedAttempts));

                // Act: apply failures sequentially
                for (var i = 0; i < sequenceLength; i++)
                {
                    lockedOutResult = service.IncrementFailedAttemptsAsync(user.Id)
                        .GetAwaiter().GetResult();

                    var expectedCount = i + 1;
                    var expectedLocked = expectedCount >= MaxFailedAttempts;

                    // Assert each step
                    currentCount.Should().Be(expectedCount,
                        because: $"after {i + 1} failures, count should be {expectedCount}");

                    lockedOutResult.Should().Be(expectedLocked,
                        because: $"at count {expectedCount}, locked should be {expectedLocked}");

                    if (expectedLocked)
                    {
                        break; // Account is locked, no further increments expected
                    }
                }

                return true;
            });
    }

    #endregion

    #region Generators

    /// <summary>
    /// Generates an initial failed count between 0 and 4 (below lockout threshold).
    /// </summary>
    private static Arbitrary<int> GenerateInitialFailedCount()
    {
        var gen = Gen.Choose(0, MaxFailedAttempts - 1);
        return Arb.From(gen);
    }

    /// <summary>
    /// Generates a sequence length between 1 and 7 to test sequences that
    /// may or may not reach the lockout threshold.
    /// </summary>
    private static Arbitrary<int> GenerateFailureSequenceLength()
    {
        var gen = Gen.Choose(1, 7);
        return Arb.From(gen);
    }

    #endregion

    #region Helper Methods

    private static (AccountLockoutService Service, Mock<UserManager<ApplicationUser>> UserManagerMock, ApplicationUser User)
        CreateServiceWithFailedCount(int failedCount)
    {
        var user = CreateTestUser(failedCount);
        var userManagerMock = CreateUserManagerMock(user);

        var service = new AccountLockoutService(
            userManagerMock.Object,
            Mock.Of<ILogger<AccountLockoutService>>());

        return (service, userManagerMock, user);
    }

    private static ApplicationUser CreateTestUser(int failedCount)
    {
        return new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "test@buildestate.com",
            Email = "test@buildestate.com",
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            AccessFailedCount = failedCount,
            LockoutEnabled = true,
            LockoutEnd = null
        };
    }

    private static Mock<UserManager<ApplicationUser>> CreateUserManagerMock(ApplicationUser user)
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

        // Setup FindByIdAsync to return the user
        userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);

        // Setup GetLockoutEnabledAsync - lockout is enabled
        userManagerMock.Setup(m => m.GetLockoutEnabledAsync(user))
            .ReturnsAsync(true);

        // Setup SetLockoutEnabledAsync
        userManagerMock.Setup(m => m.SetLockoutEnabledAsync(user, It.IsAny<bool>()))
            .ReturnsAsync(IdentityResult.Success);

        return userManagerMock;
    }

    #endregion
}
