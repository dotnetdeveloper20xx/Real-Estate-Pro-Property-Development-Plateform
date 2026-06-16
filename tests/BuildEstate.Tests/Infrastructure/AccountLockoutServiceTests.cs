using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

/// <summary>
/// Unit tests for AccountLockoutService verifying lockout management behavior
/// using ASP.NET Identity's built-in lockout mechanism.
/// </summary>
public class AccountLockoutServiceTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<ILogger<AccountLockoutService>> _loggerMock;
    private readonly AccountLockoutService _sut;

    public AccountLockoutServiceTests()
    {
        var storeMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            storeMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _loggerMock = new Mock<ILogger<AccountLockoutService>>();

        _sut = new AccountLockoutService(_userManagerMock.Object, _loggerMock.Object);
    }

    private ApplicationUser CreateTestUser(string id = "user-1") => new()
    {
        Id = id,
        Email = "test@example.com",
        FirstName = "Test",
        LastName = "User"
    };

    // ─────────────────────────────────────────────────────────────────
    // IsLockedOutAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task IsLockedOutAsync_WhenUserIsLockedOut_ReturnsTrue()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsLockedOutAsync(user)).ReturnsAsync(true);

        // Act
        var result = await _sut.IsLockedOutAsync("user-1");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsLockedOutAsync_WhenUserIsNotLockedOut_ReturnsFalse()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsLockedOutAsync(user)).ReturnsAsync(false);

        // Act
        var result = await _sut.IsLockedOutAsync("user-1");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsLockedOutAsync_WhenUserNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        _userManagerMock.Setup(x => x.FindByIdAsync("unknown")).ReturnsAsync((ApplicationUser?)null);

        // Act
        var act = () => _sut.IsLockedOutAsync("unknown");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    // ─────────────────────────────────────────────────────────────────
    // GetFailedAttemptsCountAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetFailedAttemptsCountAsync_ReturnsCurrentFailedCount()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetAccessFailedCountAsync(user)).ReturnsAsync(3);

        // Act
        var result = await _sut.GetFailedAttemptsCountAsync("user-1");

        // Assert
        result.Should().Be(3);
    }

    [Fact]
    public async Task GetFailedAttemptsCountAsync_WhenNoFailures_ReturnsZero()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetAccessFailedCountAsync(user)).ReturnsAsync(0);

        // Act
        var result = await _sut.GetFailedAttemptsCountAsync("user-1");

        // Assert
        result.Should().Be(0);
    }

    // ─────────────────────────────────────────────────────────────────
    // GetLockoutEndAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetLockoutEndAsync_WhenLockedOut_ReturnsLockoutEndDate()
    {
        // Arrange
        var user = CreateTestUser();
        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(10);
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEndDateAsync(user)).ReturnsAsync(lockoutEnd);

        // Act
        var result = await _sut.GetLockoutEndAsync("user-1");

        // Assert
        result.Should().Be(lockoutEnd);
    }

    [Fact]
    public async Task GetLockoutEndAsync_WhenLockoutExpired_ReturnsNull()
    {
        // Arrange
        var user = CreateTestUser();
        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(-5);
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEndDateAsync(user)).ReturnsAsync(lockoutEnd);

        // Act
        var result = await _sut.GetLockoutEndAsync("user-1");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetLockoutEndAsync_WhenNoLockout_ReturnsNull()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEndDateAsync(user)).ReturnsAsync((DateTimeOffset?)null);

        // Act
        var result = await _sut.GetLockoutEndAsync("user-1");

        // Assert
        result.Should().BeNull();
    }

    // ─────────────────────────────────────────────────────────────────
    // IncrementFailedAttemptsAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task IncrementFailedAttemptsAsync_WhenNotLockedOut_ReturnsFalse()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEnabledAsync(user)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.AccessFailedAsync(user)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetAccessFailedCountAsync(user)).ReturnsAsync(1);
        _userManagerMock.Setup(x => x.IsLockedOutAsync(user)).ReturnsAsync(false);

        // Act
        var result = await _sut.IncrementFailedAttemptsAsync("user-1");

        // Assert
        result.Should().BeFalse();
        _userManagerMock.Verify(x => x.AccessFailedAsync(user), Times.Once);
    }

    [Fact]
    public async Task IncrementFailedAttemptsAsync_WhenAccountBecomesLocked_ReturnsTrue()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEnabledAsync(user)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.AccessFailedAsync(user)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetAccessFailedCountAsync(user)).ReturnsAsync(5);
        _userManagerMock.Setup(x => x.IsLockedOutAsync(user)).ReturnsAsync(true);

        // Act
        var result = await _sut.IncrementFailedAttemptsAsync("user-1");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IncrementFailedAttemptsAsync_EnablesLockoutIfNotEnabled()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEnabledAsync(user)).ReturnsAsync(false);
        _userManagerMock.Setup(x => x.SetLockoutEnabledAsync(user, true)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AccessFailedAsync(user)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetAccessFailedCountAsync(user)).ReturnsAsync(1);
        _userManagerMock.Setup(x => x.IsLockedOutAsync(user)).ReturnsAsync(false);

        // Act
        var result = await _sut.IncrementFailedAttemptsAsync("user-1");

        // Assert
        result.Should().BeFalse();
        _userManagerMock.Verify(x => x.SetLockoutEnabledAsync(user, true), Times.Once);
    }

    [Fact]
    public async Task IncrementFailedAttemptsAsync_WhenAccessFailedFails_ThrowsInvalidOperationException()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEnabledAsync(user)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Something went wrong" }));

        // Act
        var act = () => _sut.IncrementFailedAttemptsAsync("user-1");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Something went wrong*");
    }

    [Fact]
    public async Task IncrementFailedAttemptsAsync_WhenUserNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        _userManagerMock.Setup(x => x.FindByIdAsync("unknown")).ReturnsAsync((ApplicationUser?)null);

        // Act
        var act = () => _sut.IncrementFailedAttemptsAsync("unknown");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    // ─────────────────────────────────────────────────────────────────
    // ResetFailedAttemptsAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ResetFailedAttemptsAsync_CallsResetAccessFailedCount()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.ResetAccessFailedCountAsync(user)).ReturnsAsync(IdentityResult.Success);

        // Act
        await _sut.ResetFailedAttemptsAsync("user-1");

        // Assert
        _userManagerMock.Verify(x => x.ResetAccessFailedCountAsync(user), Times.Once);
    }

    [Fact]
    public async Task ResetFailedAttemptsAsync_WhenResetFails_ThrowsInvalidOperationException()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.ResetAccessFailedCountAsync(user))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Reset failed" }));

        // Act
        var act = () => _sut.ResetFailedAttemptsAsync("user-1");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Reset failed*");
    }

    [Fact]
    public async Task ResetFailedAttemptsAsync_WhenUserNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        _userManagerMock.Setup(x => x.FindByIdAsync("unknown")).ReturnsAsync((ApplicationUser?)null);

        // Act
        var act = () => _sut.ResetFailedAttemptsAsync("unknown");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    // ─────────────────────────────────────────────────────────────────
    // GetRemainingLockoutTimeAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetRemainingLockoutTimeAsync_WhenLockedOut_ReturnsRemainingDuration()
    {
        // Arrange
        var user = CreateTestUser();
        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(10);
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEndDateAsync(user)).ReturnsAsync(lockoutEnd);

        // Act
        var result = await _sut.GetRemainingLockoutTimeAsync("user-1");

        // Assert
        result.Should().BeGreaterThan(TimeSpan.Zero);
        result.TotalMinutes.Should().BeApproximately(10, 0.1);
    }

    [Fact]
    public async Task GetRemainingLockoutTimeAsync_WhenLockoutExpired_ReturnsZero()
    {
        // Arrange
        var user = CreateTestUser();
        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(-5);
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEndDateAsync(user)).ReturnsAsync(lockoutEnd);

        // Act
        var result = await _sut.GetRemainingLockoutTimeAsync("user-1");

        // Assert
        result.Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public async Task GetRemainingLockoutTimeAsync_WhenNoLockout_ReturnsZero()
    {
        // Arrange
        var user = CreateTestUser();
        _userManagerMock.Setup(x => x.FindByIdAsync("user-1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GetLockoutEndDateAsync(user)).ReturnsAsync((DateTimeOffset?)null);

        // Act
        var result = await _sut.GetRemainingLockoutTimeAsync("user-1");

        // Assert
        result.Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public async Task GetRemainingLockoutTimeAsync_WhenUserNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        _userManagerMock.Setup(x => x.FindByIdAsync("unknown")).ReturnsAsync((ApplicationUser?)null);

        // Act
        var act = () => _sut.GetRemainingLockoutTimeAsync("unknown");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
