using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Persistence.Entities;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for Audit Log Immutability.
/// Verifies that modification or deletion attempts on AuditLog records
/// throw InvalidOperationException, enforcing append-only semantics.
/// 
/// **Validates: Requirements 20.3**
/// </summary>
public class AuditLogImmutabilityPropertyTests
{
    private BuildEstateDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new BuildEstateDbContext(options);
    }

    private static AuditLog CreateAuditLog(
        string userId = "user-1",
        string userName = "Test User",
        string action = "Create",
        string entityName = "LandOpportunity",
        string entityId = "entity-1")
    {
        return new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserName = userName,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValues = null,
            NewValues = "{\"Name\":\"Test\"}",
            AffectedColumns = "Name",
            Timestamp = DateTime.UtcNow,
            IpAddress = "127.0.0.1",
            CorrelationId = Guid.NewGuid().ToString()
        };
    }

    /// <summary>
    /// Property 19: Audit Log Immutability — modifying any AuditLog record
    /// and calling SaveChanges throws InvalidOperationException.
    /// </summary>
    [Fact]
    public async Task ModifyAuditLog_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateDbContext();
        var auditLog = CreateAuditLog();
        context.AuditLogs.Add(auditLog);
        await context.SaveChangesAsync();

        // Act — attempt to modify the audit log entry
        auditLog.Action = "Modified";

        var act = async () => await context.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*append-only*");
    }

    /// <summary>
    /// Property 19: Audit Log Immutability — deleting any AuditLog record
    /// and calling SaveChanges throws InvalidOperationException.
    /// </summary>
    [Fact]
    public async Task DeleteAuditLog_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateDbContext();
        var auditLog = CreateAuditLog();
        context.AuditLogs.Add(auditLog);
        await context.SaveChangesAsync();

        // Act — attempt to delete the audit log entry
        context.AuditLogs.Remove(auditLog);

        var act = async () => await context.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*append-only*");
    }

    /// <summary>
    /// Property 19: Audit Log Immutability — synchronous SaveChanges also enforces
    /// append-only semantics on modification attempts.
    /// </summary>
    [Fact]
    public void ModifyAuditLog_Sync_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateDbContext();
        var auditLog = CreateAuditLog();
        context.AuditLogs.Add(auditLog);
        context.SaveChanges();

        // Act — attempt to modify
        auditLog.UserName = "Hacker";

        var act = () => context.SaveChanges();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*append-only*");
    }

    /// <summary>
    /// Property 19: Audit Log Immutability — synchronous SaveChanges also enforces
    /// append-only semantics on deletion attempts.
    /// </summary>
    [Fact]
    public void DeleteAuditLog_Sync_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateDbContext();
        var auditLog = CreateAuditLog();
        context.AuditLogs.Add(auditLog);
        context.SaveChanges();

        // Act — attempt to delete
        context.AuditLogs.Remove(auditLog);

        var act = () => context.SaveChanges();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*append-only*");
    }

    /// <summary>
    /// Property 19: Audit Log Immutability — adding new AuditLog entries is permitted
    /// (append-only allows new writes).
    /// </summary>
    [Fact]
    public async Task AddAuditLog_Succeeds()
    {
        // Arrange
        using var context = CreateDbContext();
        var auditLog = CreateAuditLog();

        // Act — adding should not throw
        context.AuditLogs.Add(auditLog);
        await context.SaveChangesAsync();

        // Assert
        var count = await context.AuditLogs.CountAsync();
        count.Should().Be(1);
    }

    /// <summary>
    /// Property 19 (Property-Based): For any randomly generated AuditLog field values,
    /// modification attempts always throw InvalidOperationException.
    /// 
    /// This ensures that the immutability enforcement is independent of the data stored
    /// in the audit log entry.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ModifyAuditLog_WithRandomFields_AlwaysThrows()
    {
        var auditLogGen = from userId in Arb.Generate<NonEmptyString>()
                          from userName in Arb.Generate<NonEmptyString>()
                          from action in Gen.Elements("Create", "Update", "Delete")
                          from entityName in Gen.Elements("LandOpportunity", "Offer", "DueDiligence", "Contract", "Document")
                          from entityId in Arb.Generate<NonEmptyString>()
                          select new AuditLog
                          {
                              Id = Guid.NewGuid(),
                              UserId = userId.Get.Substring(0, Math.Min(userId.Get.Length, 50)),
                              UserName = userName.Get.Substring(0, Math.Min(userName.Get.Length, 50)),
                              Action = action,
                              EntityName = entityName,
                              EntityId = entityId.Get.Substring(0, Math.Min(entityId.Get.Length, 50)),
                              OldValues = "{\"old\":\"value\"}",
                              NewValues = "{\"new\":\"value\"}",
                              AffectedColumns = "Column1,Column2",
                              Timestamp = DateTime.UtcNow,
                              IpAddress = "192.168.1.1",
                              CorrelationId = Guid.NewGuid().ToString()
                          };

        return Prop.ForAll(
            auditLogGen.ToArbitrary(),
            auditLog =>
            {
                using var context = CreateDbContext();

                // Add the audit log entry
                context.AuditLogs.Add(auditLog);
                context.SaveChanges();

                // Attempt modification
                auditLog.Action = "Tampered";

                var modifyThrows = false;
                try
                {
                    context.SaveChanges();
                }
                catch (InvalidOperationException)
                {
                    modifyThrows = true;
                }

                return modifyThrows
                    .Label($"Modification of AuditLog with UserId='{auditLog.UserId}' should throw InvalidOperationException");
            });
    }

    /// <summary>
    /// Property 19 (Property-Based): For any randomly generated AuditLog field values,
    /// deletion attempts always throw InvalidOperationException.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DeleteAuditLog_WithRandomFields_AlwaysThrows()
    {
        var auditLogGen = from userId in Arb.Generate<NonEmptyString>()
                          from userName in Arb.Generate<NonEmptyString>()
                          from action in Gen.Elements("Create", "Update", "Delete")
                          from entityName in Gen.Elements("LandOpportunity", "Offer", "DueDiligence", "Contract", "Document")
                          from entityId in Arb.Generate<NonEmptyString>()
                          select new AuditLog
                          {
                              Id = Guid.NewGuid(),
                              UserId = userId.Get.Substring(0, Math.Min(userId.Get.Length, 50)),
                              UserName = userName.Get.Substring(0, Math.Min(userName.Get.Length, 50)),
                              Action = action,
                              EntityName = entityName,
                              EntityId = entityId.Get.Substring(0, Math.Min(entityId.Get.Length, 50)),
                              OldValues = "{\"old\":\"value\"}",
                              NewValues = "{\"new\":\"value\"}",
                              AffectedColumns = "Column1,Column2",
                              Timestamp = DateTime.UtcNow,
                              IpAddress = "10.0.0.1",
                              CorrelationId = Guid.NewGuid().ToString()
                          };

        return Prop.ForAll(
            auditLogGen.ToArbitrary(),
            auditLog =>
            {
                using var context = CreateDbContext();

                // Add the audit log entry
                context.AuditLogs.Add(auditLog);
                context.SaveChanges();

                // Attempt deletion
                context.AuditLogs.Remove(auditLog);

                var deleteThrows = false;
                try
                {
                    context.SaveChanges();
                }
                catch (InvalidOperationException)
                {
                    deleteThrows = true;
                }

                return deleteThrows
                    .Label($"Deletion of AuditLog with UserId='{auditLog.UserId}' should throw InvalidOperationException");
            });
    }
}
