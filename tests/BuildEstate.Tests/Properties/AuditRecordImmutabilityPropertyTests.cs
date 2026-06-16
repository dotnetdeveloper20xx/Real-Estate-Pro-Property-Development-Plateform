using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Persistence;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Audit Records Are Immutable (Property 12).
///
/// Property 12: Audit Records Are Immutable
/// For any existing audit log entry, verify modification/deletion attempts fail.
///
/// The DbContext enforces AuditLogEntry immutability by throwing InvalidOperationException
/// when any tracked AuditLogEntry has a Modified or Deleted state on SaveChanges.
///
/// **Validates: Requirements 12.4**
/// </summary>
public class AuditRecordImmutabilityPropertyTests
{
    private BuildEstateDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new BuildEstateDbContext(options);
    }

    /// <summary>
    /// Generates valid audit log action names.
    /// </summary>
    private static Gen<string> ActionGen()
    {
        return Gen.Elements(
            "UserLogin", "UserLogout", "UserCreated", "UserUpdated",
            "UserDeactivated", "UserReactivated", "PasswordReset",
            "PasswordChanged", "RoleAssigned", "RoleRemoved",
            "PermissionChanged", "SessionRevoked", "AllSessionsRevoked");
    }

    /// <summary>
    /// Generates a random AuditLogEntry with valid field values.
    /// </summary>
    private static Gen<AuditLogEntry> AuditLogEntryGen()
    {
        return from action in ActionGen()
               from performedByLen in Gen.Choose(3, 15)
               from performedByChars in Gen.ArrayOf(performedByLen,
                   Gen.Elements("abcdefghijklmnopqrstuvwxyz0123456789".ToCharArray()))
               from performerName in Gen.Elements("Admin User", "John Smith", "Jane Doe", "System Admin")
               from targetName in Gen.Elements("Target User", "Bob Wilson", "Alice Brown", (string)null!)
               from ipOctet1 in Gen.Choose(1, 255)
               from ipOctet2 in Gen.Choose(0, 255)
               from ipOctet3 in Gen.Choose(0, 255)
               from ipOctet4 in Gen.Choose(1, 254)
               select new AuditLogEntry
               {
                   Id = Guid.NewGuid(),
                   Timestamp = DateTime.UtcNow,
                   Action = action,
                   PerformedByUserId = new string(performedByChars),
                   PerformedByUserName = performerName,
                   TargetEntityType = "User",
                   TargetEntityId = Guid.NewGuid().ToString(),
                   TargetUserName = targetName,
                   IpAddress = $"{ipOctet1}.{ipOctet2}.{ipOctet3}.{ipOctet4}",
                   OldValues = "{\"IsActive\": true}",
                   NewValues = "{\"IsActive\": false}",
                   AffectedFields = "IsActive",
                   CorrelationId = Guid.NewGuid().ToString(),
                   Details = "Test audit entry"
               };
    }

    /// <summary>
    /// Property 12: For any randomly generated AuditLogEntry, modifying any field
    /// and calling SaveChanges SHALL throw InvalidOperationException.
    ///
    /// **Validates: Requirements 12.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ModifyAuditLogEntry_AlwaysThrowsInvalidOperationException()
    {
        return Prop.ForAll(
            AuditLogEntryGen().ToArbitrary(),
            entry =>
            {
                using var context = CreateDbContext();

                // Add the audit log entry
                context.AuditLogEntries.Add(entry);
                context.SaveChanges();

                // Attempt modification on various fields
                entry.Action = "Tampered";

                var throwsOnModify = false;
                try
                {
                    context.SaveChanges();
                }
                catch (InvalidOperationException ex) when (ex.Message.Contains("immutable"))
                {
                    throwsOnModify = true;
                }

                return throwsOnModify
                    .Label($"Modifying AuditLogEntry with action '{entry.Action}' " +
                           $"performed by '{entry.PerformedByUserId}' must throw InvalidOperationException");
            });
    }

    /// <summary>
    /// Property 12: For any randomly generated AuditLogEntry, deleting the entry
    /// and calling SaveChanges SHALL throw InvalidOperationException.
    ///
    /// **Validates: Requirements 12.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DeleteAuditLogEntry_AlwaysThrowsInvalidOperationException()
    {
        return Prop.ForAll(
            AuditLogEntryGen().ToArbitrary(),
            entry =>
            {
                using var context = CreateDbContext();

                // Add the audit log entry
                context.AuditLogEntries.Add(entry);
                context.SaveChanges();

                // Attempt deletion
                context.AuditLogEntries.Remove(entry);

                var throwsOnDelete = false;
                try
                {
                    context.SaveChanges();
                }
                catch (InvalidOperationException ex) when (ex.Message.Contains("immutable"))
                {
                    throwsOnDelete = true;
                }

                return throwsOnDelete
                    .Label($"Deleting AuditLogEntry with action '{entry.Action}' " +
                           $"performed by '{entry.PerformedByUserId}' must throw InvalidOperationException");
            });
    }

    /// <summary>
    /// Property 12 (complementary): Adding new AuditLogEntry records is always permitted
    /// (append-only allows new writes but not modifications or deletions).
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AddAuditLogEntry_AlwaysSucceeds()
    {
        return Prop.ForAll(
            AuditLogEntryGen().ToArbitrary(),
            entry =>
            {
                using var context = CreateDbContext();

                // Adding should never throw
                var addSucceeds = true;
                try
                {
                    context.AuditLogEntries.Add(entry);
                    context.SaveChanges();
                }
                catch
                {
                    addSucceeds = false;
                }

                return addSucceeds
                    .Label($"Adding AuditLogEntry with action '{entry.Action}' must always succeed");
            });
    }
}
