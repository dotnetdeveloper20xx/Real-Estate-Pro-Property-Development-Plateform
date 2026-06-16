using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

/// <summary>
/// Unit tests for PasswordHistoryService verifying password reuse detection
/// and history recording behavior per Requirement 17.7.
/// </summary>
public class PasswordHistoryServiceTests : IDisposable
{
    private readonly BuildEstateDbContext _dbContext;
    private readonly Mock<IPasswordHasher<ApplicationUser>> _passwordHasherMock;
    private readonly Mock<ILogger<PasswordHistoryService>> _loggerMock;
    private readonly PasswordHistoryService _sut;

    public PasswordHistoryServiceTests()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new BuildEstateDbContext(options);
        _passwordHasherMock = new Mock<IPasswordHasher<ApplicationUser>>();
        _loggerMock = new Mock<ILogger<PasswordHistoryService>>();

        _sut = new PasswordHistoryService(
            _dbContext,
            _passwordHasherMock.Object,
            _loggerMock.Object);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    // ─────────────────────────────────────────────────────────────────
    // IsPasswordReusedAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task IsPasswordReusedAsync_WhenPasswordMatchesRecentHash_ReturnsTrue()
    {
        // Arrange
        const string userId = "user-1";
        const string newPassword = "NewPass123!";

        await SeedPasswordHistory(userId, "hash-1", DateTime.UtcNow.AddDays(-1));

        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                It.IsAny<ApplicationUser>(), "hash-1", newPassword))
            .Returns(PasswordVerificationResult.Success);

        // Act
        var result = await _sut.IsPasswordReusedAsync(userId, newPassword);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsPasswordReusedAsync_WhenPasswordMatchesWithRehashNeeded_ReturnsTrue()
    {
        // Arrange
        const string userId = "user-1";
        const string newPassword = "OldPass456!";

        await SeedPasswordHistory(userId, "old-hash", DateTime.UtcNow.AddDays(-5));

        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                It.IsAny<ApplicationUser>(), "old-hash", newPassword))
            .Returns(PasswordVerificationResult.SuccessRehashNeeded);

        // Act
        var result = await _sut.IsPasswordReusedAsync(userId, newPassword);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsPasswordReusedAsync_WhenPasswordDoesNotMatchAnyHash_ReturnsFalse()
    {
        // Arrange
        const string userId = "user-1";
        const string newPassword = "BrandNew789!";

        await SeedPasswordHistory(userId, "hash-1", DateTime.UtcNow.AddDays(-1));
        await SeedPasswordHistory(userId, "hash-2", DateTime.UtcNow.AddDays(-2));

        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                It.IsAny<ApplicationUser>(), It.IsAny<string>(), newPassword))
            .Returns(PasswordVerificationResult.Failed);

        // Act
        var result = await _sut.IsPasswordReusedAsync(userId, newPassword);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsPasswordReusedAsync_WhenNoHistoryExists_ReturnsFalse()
    {
        // Arrange
        const string userId = "user-no-history";
        const string newPassword = "AnyPassword1!";

        // Act
        var result = await _sut.IsPasswordReusedAsync(userId, newPassword);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsPasswordReusedAsync_OnlyChecksLast5Entries()
    {
        // Arrange
        const string userId = "user-1";
        const string newPassword = "OldestPass1!";

        // Seed 6 entries — the oldest (6th) should NOT be checked
        for (int i = 1; i <= 6; i++)
        {
            await SeedPasswordHistory(userId, $"hash-{i}", DateTime.UtcNow.AddDays(-i));
        }

        // The oldest hash is "hash-6" (6 days ago). Set it to match.
        // Hashes 1–5 should fail, hash-6 should match but won't be checked.
        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                It.IsAny<ApplicationUser>(), "hash-6", newPassword))
            .Returns(PasswordVerificationResult.Success);

        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                It.IsAny<ApplicationUser>(), It.Is<string>(h => h != "hash-6"), newPassword))
            .Returns(PasswordVerificationResult.Failed);

        // Act
        var result = await _sut.IsPasswordReusedAsync(userId, newPassword);

        // Assert
        result.Should().BeFalse();
        _passwordHasherMock.Verify(
            x => x.VerifyHashedPassword(It.IsAny<ApplicationUser>(), "hash-6", newPassword),
            Times.Never);
    }

    [Fact]
    public async Task IsPasswordReusedAsync_DoesNotCheckOtherUsersHistory()
    {
        // Arrange
        const string userId = "user-1";
        const string otherUserId = "user-2";
        const string newPassword = "SharedPass1!";

        await SeedPasswordHistory(otherUserId, "other-user-hash", DateTime.UtcNow.AddDays(-1));

        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                It.IsAny<ApplicationUser>(), "other-user-hash", newPassword))
            .Returns(PasswordVerificationResult.Success);

        // Act
        var result = await _sut.IsPasswordReusedAsync(userId, newPassword);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsPasswordReusedAsync_StopsOnFirstMatch()
    {
        // Arrange
        const string userId = "user-1";
        const string newPassword = "MatchFirst1!";

        await SeedPasswordHistory(userId, "hash-recent", DateTime.UtcNow.AddDays(-1));
        await SeedPasswordHistory(userId, "hash-older", DateTime.UtcNow.AddDays(-2));

        _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                It.IsAny<ApplicationUser>(), "hash-recent", newPassword))
            .Returns(PasswordVerificationResult.Success);

        // Act
        var result = await _sut.IsPasswordReusedAsync(userId, newPassword);

        // Assert
        result.Should().BeTrue();
        // hash-older should never be checked since hash-recent matched first
        _passwordHasherMock.Verify(
            x => x.VerifyHashedPassword(It.IsAny<ApplicationUser>(), "hash-older", newPassword),
            Times.Never);
    }

    // ─────────────────────────────────────────────────────────────────
    // RecordPasswordChangeAsync
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RecordPasswordChangeAsync_StoresPasswordHashEntry()
    {
        // Arrange
        const string userId = "user-1";
        const string passwordHash = "hashed-password-value";

        // Act
        await _sut.RecordPasswordChangeAsync(userId, passwordHash);

        // Assert
        var entries = await _dbContext.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .ToListAsync();

        entries.Should().HaveCount(1);
        entries[0].PasswordHash.Should().Be(passwordHash);
        entries[0].UserId.Should().Be(userId);
        entries[0].CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task RecordPasswordChangeAsync_CreatesUniqueIdForEachEntry()
    {
        // Arrange
        const string userId = "user-1";

        // Act
        await _sut.RecordPasswordChangeAsync(userId, "hash-1");
        await _sut.RecordPasswordChangeAsync(userId, "hash-2");

        // Assert
        var entries = await _dbContext.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .ToListAsync();

        entries.Should().HaveCount(2);
        entries[0].Id.Should().NotBe(entries[1].Id);
    }

    [Fact]
    public async Task RecordPasswordChangeAsync_MultipleRecordsForSameUser_AllPersisted()
    {
        // Arrange
        const string userId = "user-1";

        // Act
        for (int i = 1; i <= 5; i++)
        {
            await _sut.RecordPasswordChangeAsync(userId, $"hash-{i}");
        }

        // Assert
        var count = await _dbContext.PasswordHistories
            .CountAsync(ph => ph.UserId == userId);

        count.Should().Be(5);
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    private async Task SeedPasswordHistory(string userId, string hash, DateTime createdAt)
    {
        var entry = new PasswordHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PasswordHash = hash,
            CreatedAt = createdAt
        };

        await _dbContext.PasswordHistories.AddAsync(entry);
        await _dbContext.SaveChangesAsync();
    }
}
