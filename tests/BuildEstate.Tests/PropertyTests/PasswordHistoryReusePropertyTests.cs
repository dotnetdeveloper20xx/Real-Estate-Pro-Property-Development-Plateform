using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for Password History Prevents Reuse (Property 17).
/// Verifies that a password matching any of the previous 5 entries is rejected,
/// and a password matching none of the previous 5 entries is accepted.
///
/// **Validates: Requirements 17.7**
/// </summary>
public class PasswordHistoryReusePropertyTests
{
    private static BuildEstateDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new BuildEstateDbContext(options);
    }

    /// <summary>
    /// Seeds N password history entries for a given user.
    /// Returns the list of hashes that were seeded.
    /// </summary>
    private static async Task<List<string>> SeedPasswordHistoryAsync(
        BuildEstateDbContext context, string userId, int count)
    {
        var hashes = new List<string>();
        for (var i = 0; i < count; i++)
        {
            var hash = $"hashed_password_{i}_{Guid.NewGuid():N}";
            hashes.Add(hash);
            context.PasswordHistories.Add(new PasswordHistory
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PasswordHash = hash,
                CreatedAt = DateTime.UtcNow.AddDays(-count + i)
            });
        }

        await context.SaveChangesAsync();
        return hashes;
    }

    /// <summary>
    /// Property 17: For any user with N password history entries (1 <= N <= 5),
    /// if the password hasher reports Success for any stored hash, IsPasswordReusedAsync returns true.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property PasswordMatchingAnyOfLast5_IsDetectedAsReused()
    {
        // Generate count of history entries between 1 and 5
        var countGen = Gen.Choose(1, 5);
        // Generate which entry index should match (0-based, within range)
        var genPair = countGen.SelectMany(count =>
            Gen.Choose(0, count - 1).Select(matchIdx => (Count: count, MatchIndex: matchIdx)));

        return Prop.ForAll(
            genPair.ToArbitrary(),
            pair =>
            {
                var (historyCount, matchIndex) = pair;
                var userId = Guid.NewGuid().ToString();
                var newPassword = "TestPassword123!";

                using var context = CreateDbContext();

                // Seed password history
                var hashes = SeedPasswordHistoryAsync(context, userId, historyCount)
                    .GetAwaiter().GetResult();

                // The service retrieves hashes ordered by CreatedAt DESC, so the last seeded is first.
                // We seeded with ascending CreatedAt, so reversing gives us the DB retrieval order.
                var reversedHashes = new List<string>(hashes);
                reversedHashes.Reverse();

                // Mock the password hasher: return Success for the target hash, Failed for others
                var targetHash = reversedHashes[matchIndex];
                var hasherMock = new Mock<IPasswordHasher<ApplicationUser>>();
                hasherMock
                    .Setup(h => h.VerifyHashedPassword(
                        It.IsAny<ApplicationUser>(),
                        It.IsAny<string>(),
                        It.Is<string>(p => p == newPassword)))
                    .Returns((ApplicationUser _, string storedHash, string _) =>
                        storedHash == targetHash
                            ? PasswordVerificationResult.Success
                            : PasswordVerificationResult.Failed);

                var loggerMock = new Mock<ILogger<PasswordHistoryService>>();
                var service = new PasswordHistoryService(context, hasherMock.Object, loggerMock.Object);

                // Act
                var result = service.IsPasswordReusedAsync(userId, newPassword)
                    .GetAwaiter().GetResult();

                // Assert
                return result.Label(
                    $"Password matching entry at index {matchIndex} of {historyCount} history entries should be detected as reused");
            });
    }

    /// <summary>
    /// Property 17: For any user with N password history entries (1 <= N <= 5),
    /// if the password hasher reports Failed for all stored hashes, IsPasswordReusedAsync returns false.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property PasswordNotMatchingAnyOfLast5_IsNotReused()
    {
        var countGen = Gen.Choose(1, 5);

        return Prop.ForAll(
            countGen.ToArbitrary(),
            historyCount =>
            {
                var userId = Guid.NewGuid().ToString();
                var newPassword = "CompletelyNewPassword456!";

                using var context = CreateDbContext();

                // Seed password history
                SeedPasswordHistoryAsync(context, userId, historyCount)
                    .GetAwaiter().GetResult();

                // Mock the password hasher: always return Failed (no match)
                var hasherMock = new Mock<IPasswordHasher<ApplicationUser>>();
                hasherMock
                    .Setup(h => h.VerifyHashedPassword(
                        It.IsAny<ApplicationUser>(),
                        It.IsAny<string>(),
                        It.IsAny<string>()))
                    .Returns(PasswordVerificationResult.Failed);

                var loggerMock = new Mock<ILogger<PasswordHistoryService>>();
                var service = new PasswordHistoryService(context, hasherMock.Object, loggerMock.Object);

                // Act
                var result = service.IsPasswordReusedAsync(userId, newPassword)
                    .GetAwaiter().GetResult();

                // Assert
                return (!result).Label(
                    $"Password not matching any of {historyCount} history entries should not be detected as reused");
            });
    }

    /// <summary>
    /// Property 17: When a user has more than 5 password history entries,
    /// only the most recent 5 are checked. A password matching an older (6th+) entry
    /// should NOT be flagged as reused.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PasswordMatchingOlderThan5thEntry_IsNotReused()
    {
        // Generate total history count between 6 and 10
        var countGen = Gen.Choose(6, 10);

        return Prop.ForAll(
            countGen.ToArbitrary(),
            totalCount =>
            {
                var userId = Guid.NewGuid().ToString();
                var newPassword = "OldPassword789!";

                using var context = CreateDbContext();

                // Seed password history
                var hashes = SeedPasswordHistoryAsync(context, userId, totalCount)
                    .GetAwaiter().GetResult();

                // The service takes Top 5 by CreatedAt DESC.
                // Hashes are seeded with ascending CreatedAt, so the last 5 seeded are the most recent.
                // The "old" hashes (indices 0 to totalCount-6) should not be checked.
                var recentHashes = hashes.Skip(totalCount - 5).ToHashSet();
                var oldHash = hashes[0]; // This is the oldest, should not be checked

                // Mock: return Success only for the old hash, Failed for recent ones
                var hasherMock = new Mock<IPasswordHasher<ApplicationUser>>();
                hasherMock
                    .Setup(h => h.VerifyHashedPassword(
                        It.IsAny<ApplicationUser>(),
                        It.IsAny<string>(),
                        It.Is<string>(p => p == newPassword)))
                    .Returns((ApplicationUser _, string storedHash, string _) =>
                        storedHash == oldHash
                            ? PasswordVerificationResult.Success
                            : PasswordVerificationResult.Failed);

                var loggerMock = new Mock<ILogger<PasswordHistoryService>>();
                var service = new PasswordHistoryService(context, hasherMock.Object, loggerMock.Object);

                // Act
                var result = service.IsPasswordReusedAsync(userId, newPassword)
                    .GetAwaiter().GetResult();

                // Assert: old hash is NOT in the top 5, so the service should NOT call hasher with it
                // and result should be false
                return (!result).Label(
                    $"Password matching entry older than the 5th most recent (out of {totalCount}) should not be flagged as reused");
            });
    }

    /// <summary>
    /// Property 17: SuccessRehashNeeded is also treated as a match.
    /// For any user with history entries, if the hasher returns SuccessRehashNeeded,
    /// the password should be detected as reused.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PasswordMatchWithRehashNeeded_IsDetectedAsReused()
    {
        var countGen = Gen.Choose(1, 5);

        return Prop.ForAll(
            countGen.ToArbitrary(),
            historyCount =>
            {
                var userId = Guid.NewGuid().ToString();
                var newPassword = "RehashPassword321!";

                using var context = CreateDbContext();

                // Seed password history
                var hashes = SeedPasswordHistoryAsync(context, userId, historyCount)
                    .GetAwaiter().GetResult();

                // Mock: first hash in the retrieved order returns SuccessRehashNeeded
                var reversedHashes = new List<string>(hashes);
                reversedHashes.Reverse();
                var targetHash = reversedHashes[0];

                var hasherMock = new Mock<IPasswordHasher<ApplicationUser>>();
                hasherMock
                    .Setup(h => h.VerifyHashedPassword(
                        It.IsAny<ApplicationUser>(),
                        It.IsAny<string>(),
                        It.Is<string>(p => p == newPassword)))
                    .Returns((ApplicationUser _, string storedHash, string _) =>
                        storedHash == targetHash
                            ? PasswordVerificationResult.SuccessRehashNeeded
                            : PasswordVerificationResult.Failed);

                var loggerMock = new Mock<ILogger<PasswordHistoryService>>();
                var service = new PasswordHistoryService(context, hasherMock.Object, loggerMock.Object);

                // Act
                var result = service.IsPasswordReusedAsync(userId, newPassword)
                    .GetAwaiter().GetResult();

                // Assert
                return result.Label(
                    $"Password matching via SuccessRehashNeeded should be detected as reused");
            });
    }
}
