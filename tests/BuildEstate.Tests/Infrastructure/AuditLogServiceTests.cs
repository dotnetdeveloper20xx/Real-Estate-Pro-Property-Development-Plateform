using BuildEstate.Application.Common;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

/// <summary>
/// Unit tests for AuditLogService verifying:
/// - Immutable audit log entry creation with all required fields
/// - Query with pagination, filtering by action type, user, and date range
/// - Date range validation (max 12-month span)
/// - No update/delete operations exposed
/// </summary>
public class AuditLogServiceTests : IDisposable
{
    private readonly BuildEstateDbContext _dbContext;
    private readonly AuditLogService _sut;
    private readonly Mock<ILogger<AuditLogService>> _loggerMock;

    public AuditLogServiceTests()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: $"AuditLogServiceTests_{Guid.NewGuid()}")
            .Options;

        _dbContext = new BuildEstateDbContext(options);
        _loggerMock = new Mock<ILogger<AuditLogService>>();
        _sut = new AuditLogService(_dbContext, _loggerMock.Object);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    #region LogAsync Tests

    [Fact]
    public async Task LogAsync_WithValidEntry_PersistsEntryToDatabase()
    {
        // Arrange
        var entry = CreateValidAuditEntry();

        // Act
        await _sut.LogAsync(entry);

        // Assert
        var persisted = await _dbContext.AuditLogEntries.FirstOrDefaultAsync();
        persisted.Should().NotBeNull();
        persisted!.Action.Should().Be(entry.Action);
        persisted.PerformedByUserId.Should().Be(entry.PerformedByUserId);
        persisted.PerformedByUserName.Should().Be(entry.PerformedByUserName);
        persisted.TargetEntityType.Should().Be(entry.TargetEntityType);
        persisted.TargetEntityId.Should().Be(entry.TargetEntityId);
        persisted.TargetUserName.Should().Be(entry.TargetUserName);
        persisted.IpAddress.Should().Be(entry.IpAddress);
        persisted.OldValues.Should().Be(entry.OldValues);
        persisted.NewValues.Should().Be(entry.NewValues);
        persisted.AffectedFields.Should().Be(entry.AffectedFields);
        persisted.CorrelationId.Should().Be(entry.CorrelationId);
        persisted.Details.Should().Be(entry.Details);
    }

    [Fact]
    public async Task LogAsync_WithDefaultTimestamp_SetsTimestampToUtcNow()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        entry.Timestamp = default;

        var before = DateTime.UtcNow;

        // Act
        await _sut.LogAsync(entry);

        var after = DateTime.UtcNow;

        // Assert
        var persisted = await _dbContext.AuditLogEntries.FirstAsync();
        persisted.Timestamp.Should().BeOnOrAfter(before);
        persisted.Timestamp.Should().BeOnOrBefore(after);
    }

    [Fact]
    public async Task LogAsync_WithEmptyId_AssignsNewGuid()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        entry.Id = Guid.Empty;

        // Act
        await _sut.LogAsync(entry);

        // Assert
        var persisted = await _dbContext.AuditLogEntries.FirstAsync();
        persisted.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task LogAsync_WithNullEntry_ThrowsArgumentNullException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _sut.LogAsync(null!));
    }

    [Fact]
    public async Task LogAsync_PreservesAllRequiredFields()
    {
        // Arrange
        var entry = new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = new DateTime(2024, 6, 15, 10, 30, 0, DateTimeKind.Utc),
            Action = "UserDeactivated",
            PerformedByUserId = "admin-001",
            PerformedByUserName = "John Admin",
            TargetEntityType = "User",
            TargetEntityId = "user-123",
            TargetUserName = "Jane Doe",
            IpAddress = "192.168.1.100",
            OldValues = "{\"IsActive\":true}",
            NewValues = "{\"IsActive\":false}",
            AffectedFields = "IsActive",
            CorrelationId = "corr-abc-123",
            Details = "User deactivated by administrator"
        };

        // Act
        await _sut.LogAsync(entry);

        // Assert
        var persisted = await _dbContext.AuditLogEntries.FirstAsync();
        persisted.Timestamp.Should().Be(new DateTime(2024, 6, 15, 10, 30, 0, DateTimeKind.Utc));
        persisted.Action.Should().Be("UserDeactivated");
        persisted.PerformedByUserId.Should().Be("admin-001");
        persisted.PerformedByUserName.Should().Be("John Admin");
        persisted.TargetEntityType.Should().Be("User");
        persisted.TargetEntityId.Should().Be("user-123");
        persisted.TargetUserName.Should().Be("Jane Doe");
        persisted.IpAddress.Should().Be("192.168.1.100");
        persisted.OldValues.Should().Be("{\"IsActive\":true}");
        persisted.NewValues.Should().Be("{\"IsActive\":false}");
        persisted.AffectedFields.Should().Be("IsActive");
        persisted.CorrelationId.Should().Be("corr-abc-123");
        persisted.Details.Should().Be("User deactivated by administrator");
    }

    #endregion

    #region QueryAsync Tests

    [Fact]
    public async Task QueryAsync_WithNoFilters_ReturnsAllEntriesPaginated()
    {
        // Arrange
        await SeedEntries(15);

        var queryParams = new AuditLogQueryParams { Page = 1, PageSize = 10 };

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(15);
        result.PageNumber.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalPages.Should().Be(2);
    }

    [Fact]
    public async Task QueryAsync_WithActionTypeFilter_ReturnsOnlyMatchingEntries()
    {
        // Arrange
        await SeedEntriesWithActions("UserLogin", "UserLogin", "UserDeactivated", "RoleChanged");

        var queryParams = new AuditLogQueryParams { ActionType = "UserLogin" };

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().HaveCount(2);
        result.Items.Should().OnlyContain(e => e.Action == "UserLogin");
        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task QueryAsync_WithUserIdFilter_ReturnsOnlyMatchingEntries()
    {
        // Arrange
        var targetUserId = "user-specific";
        await SeedEntriesWithUsers(targetUserId, "user-other", "user-other");

        var queryParams = new AuditLogQueryParams { UserId = targetUserId };

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items.Should().OnlyContain(e => e.PerformedByUserId == targetUserId);
    }

    [Fact]
    public async Task QueryAsync_WithDateRangeFilter_ReturnsOnlyEntriesWithinRange()
    {
        // Arrange
        var entries = new List<AuditLogEntry>
        {
            CreateEntryWithTimestamp(new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntryWithTimestamp(new DateTime(2024, 3, 15, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntryWithTimestamp(new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntryWithTimestamp(new DateTime(2024, 12, 31, 0, 0, 0, DateTimeKind.Utc))
        };
        _dbContext.AuditLogEntries.AddRange(entries);
        await _dbContext.SaveChangesAsync();

        var queryParams = new AuditLogQueryParams
        {
            DateRangeStart = new DateTime(2024, 2, 1, 0, 0, 0, DateTimeKind.Utc),
            DateRangeEnd = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task QueryAsync_WithDateRangeExceeding12Months_ThrowsArgumentException()
    {
        // Arrange
        var queryParams = new AuditLogQueryParams
        {
            DateRangeStart = new DateTime(2023, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            DateRangeEnd = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc) // > 12 months
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.QueryAsync(queryParams));

        exception.Message.Should().Contain("12 months");
    }

    [Fact]
    public async Task QueryAsync_WithEndDateBeforeStartDate_ThrowsArgumentException()
    {
        // Arrange
        var queryParams = new AuditLogQueryParams
        {
            DateRangeStart = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            DateRangeEnd = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.QueryAsync(queryParams));
    }

    [Fact]
    public async Task QueryAsync_OrdersResultsByTimestampDescending()
    {
        // Arrange
        var entries = new List<AuditLogEntry>
        {
            CreateEntryWithTimestamp(new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntryWithTimestamp(new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntryWithTimestamp(new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc))
        };
        _dbContext.AuditLogEntries.AddRange(entries);
        await _dbContext.SaveChangesAsync();

        var queryParams = new AuditLogQueryParams();

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().BeInDescendingOrder(e => e.Timestamp);
    }

    [Fact]
    public async Task QueryAsync_WithPage2_ReturnsCorrectOffset()
    {
        // Arrange
        await SeedEntries(30);

        var queryParams = new AuditLogQueryParams { Page = 2, PageSize = 10 };

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().HaveCount(10);
        result.PageNumber.Should().Be(2);
        result.TotalCount.Should().Be(30);
    }

    [Fact]
    public async Task QueryAsync_WithInvalidPageSize_DefaultsTo25()
    {
        // Arrange
        await SeedEntries(30);

        var queryParams = new AuditLogQueryParams { PageSize = 7 }; // Not in allowed sizes

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().HaveCount(25);
        result.PageSize.Should().Be(25);
    }

    [Fact]
    public async Task QueryAsync_WithNullQueryParams_ThrowsArgumentNullException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _sut.QueryAsync(null!));
    }

    [Fact]
    public async Task QueryAsync_WithCombinedFilters_AppliesAllFilters()
    {
        // Arrange
        var entries = new List<AuditLogEntry>
        {
            CreateEntry("UserLogin", "user-1", new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntry("UserLogin", "user-2", new DateTime(2024, 3, 15, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntry("UserDeactivated", "user-1", new DateTime(2024, 3, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateEntry("UserLogin", "user-1", new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc))
        };
        _dbContext.AuditLogEntries.AddRange(entries);
        await _dbContext.SaveChangesAsync();

        var queryParams = new AuditLogQueryParams
        {
            ActionType = "UserLogin",
            UserId = "user-1",
            DateRangeStart = new DateTime(2024, 2, 1, 0, 0, 0, DateTimeKind.Utc),
            DateRangeEnd = new DateTime(2024, 4, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        // Act
        var result = await _sut.QueryAsync(queryParams);

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items[0].Action.Should().Be("UserLogin");
        result.Items[0].PerformedByUserId.Should().Be("user-1");
    }

    #endregion

    #region Immutability Tests

    [Fact]
    public async Task AuditLogEntry_ModificationAttempt_ThrowsInvalidOperationException()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        await _sut.LogAsync(entry);

        // Act - attempt to modify
        var persisted = await _dbContext.AuditLogEntries.FirstAsync();
        persisted.Action = "Modified";

        // Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _dbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task AuditLogEntry_DeletionAttempt_ThrowsInvalidOperationException()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        await _sut.LogAsync(entry);

        // Act - attempt to delete
        var persisted = await _dbContext.AuditLogEntries.FirstAsync();
        _dbContext.AuditLogEntries.Remove(persisted);

        // Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _dbContext.SaveChangesAsync());
    }

    #endregion

    #region Interface Verification

    [Fact]
    public void IAuditLogService_DoesNotExposeUpdateOrDeleteOperations()
    {
        // Verify the interface only has LogAsync and QueryAsync — no update/delete
        var methods = typeof(IAuditLogService).GetMethods();

        methods.Should().NotContain(m => m.Name.Contains("Update", StringComparison.OrdinalIgnoreCase));
        methods.Should().NotContain(m => m.Name.Contains("Delete", StringComparison.OrdinalIgnoreCase));
        methods.Should().NotContain(m => m.Name.Contains("Remove", StringComparison.OrdinalIgnoreCase));
        methods.Should().HaveCount(2); // LogAsync + QueryAsync
    }

    #endregion

    #region Helper Methods

    private static AuditLogEntry CreateValidAuditEntry()
    {
        return new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Action = "UserLogin",
            PerformedByUserId = "user-001",
            PerformedByUserName = "Test User",
            TargetEntityType = "User",
            TargetEntityId = "user-002",
            TargetUserName = "Target User",
            IpAddress = "127.0.0.1",
            OldValues = null,
            NewValues = null,
            AffectedFields = null,
            CorrelationId = Guid.NewGuid().ToString(),
            Details = "User logged in successfully"
        };
    }

    private static AuditLogEntry CreateEntryWithTimestamp(DateTime timestamp)
    {
        return new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = timestamp,
            Action = "UserLogin",
            PerformedByUserId = "user-001",
            PerformedByUserName = "Test User",
            IpAddress = "127.0.0.1",
            CorrelationId = Guid.NewGuid().ToString()
        };
    }

    private static AuditLogEntry CreateEntry(string action, string userId, DateTime timestamp)
    {
        return new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = timestamp,
            Action = action,
            PerformedByUserId = userId,
            PerformedByUserName = $"User {userId}",
            IpAddress = "127.0.0.1",
            CorrelationId = Guid.NewGuid().ToString()
        };
    }

    private async Task SeedEntries(int count)
    {
        var entries = Enumerable.Range(1, count)
            .Select(i => new AuditLogEntry
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTime.UtcNow.AddMinutes(-i),
                Action = "UserLogin",
                PerformedByUserId = $"user-{i:D3}",
                PerformedByUserName = $"User {i}",
                IpAddress = "127.0.0.1",
                CorrelationId = Guid.NewGuid().ToString()
            })
            .ToList();

        _dbContext.AuditLogEntries.AddRange(entries);
        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedEntriesWithActions(params string[] actions)
    {
        var entries = actions.Select((action, i) => new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow.AddMinutes(-i),
            Action = action,
            PerformedByUserId = $"user-{i:D3}",
            PerformedByUserName = $"User {i}",
            IpAddress = "127.0.0.1",
            CorrelationId = Guid.NewGuid().ToString()
        }).ToList();

        _dbContext.AuditLogEntries.AddRange(entries);
        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedEntriesWithUsers(params string[] userIds)
    {
        var entries = userIds.Select((userId, i) => new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow.AddMinutes(-i),
            Action = "UserLogin",
            PerformedByUserId = userId,
            PerformedByUserName = $"User {userId}",
            IpAddress = "127.0.0.1",
            CorrelationId = Guid.NewGuid().ToString()
        }).ToList();

        _dbContext.AuditLogEntries.AddRange(entries);
        await _dbContext.SaveChangesAsync();
    }

    #endregion
}
