using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Persistence.Entities;
using BuildEstate.Infrastructure.Persistence.Interceptors;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for Audit Entry Completeness.
///
/// Property 22: Audit Entry Completeness
/// For any audit log entry produced by the system, the following fields SHALL be non-null:
/// UserId, UserName, Action, EntityName, EntityId, Timestamp, CorrelationId.
///
/// Generate random operations (Create, Update, Delete) on Legal Compliance entities
/// and verify the AuditLog entry structure enforces these invariants.
///
/// **Validates: Requirements 13.1, 13.2, 13.5**
/// </summary>
public class AuditEntryCompletenessPropertyTests
{
    /// <summary>
    /// Creates a BuildEstateDbContext with an in-memory database and the AuditInterceptor wired in,
    /// using the provided ICurrentUserService mock and correlation ID.
    /// </summary>
    private static BuildEstateDbContext CreateDbContextWithInterceptor(
        string userId,
        string userName,
        string correlationId)
    {
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(c => c.UserId).Returns(userId);
        currentUserServiceMock.Setup(c => c.UserName).Returns(userName);

        var httpContext = new DefaultHttpContext();
        httpContext.Items["CorrelationId"] = correlationId;

        var httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        httpContextAccessorMock.Setup(h => h.HttpContext).Returns(httpContext);

        var interceptor = new AuditInterceptor(
            currentUserServiceMock.Object,
            httpContextAccessorMock.Object);

        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(interceptor)
            .Options;

        return new BuildEstateDbContext(options);
    }

    /// <summary>
    /// FsCheck generator for non-empty user IDs (1-50 characters).
    /// </summary>
    private static Gen<string> UserIdGen =>
        Gen.Choose(1, 50)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyz0123456789-_".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// FsCheck generator for non-empty user names (2-50 characters).
    /// </summary>
    private static Gen<string> UserNameGen =>
        Gen.Choose(2, 50)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// FsCheck generator for correlation IDs (non-empty GUID strings).
    /// </summary>
    private static Gen<string> CorrelationIdGen =>
        Gen.Constant(0).Select(_ => Guid.NewGuid().ToString());

    /// <summary>
    /// FsCheck generator for valid LegalCase entities with random field values.
    /// </summary>
    private static Gen<LegalCase> LegalCaseGen =>
        from title in Gen.Choose(5, 50).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
            .Select(chars => new string(chars)))
        from description in Gen.Choose(10, 100).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
            .Select(chars => new string(chars)))
        from caseType in Gen.Elements(Enum.GetValues<LegalCaseType>())
        from priority in Gen.Elements(Enum.GetValues<LegalCasePriority>())
        select new LegalCase
        {
            Title = title,
            Description = description,
            CaseType = caseType,
            Priority = priority,
            Status = LegalCaseStatus.Open,
            CaseReference = $"LC-{DateTime.UtcNow.Year}-{System.Random.Shared.Next(1, 99999):D5}"
        };

    /// <summary>
    /// FsCheck generator for valid ComplianceRequirement entities with random field values.
    /// </summary>
    private static Gen<ComplianceRequirement> ComplianceRequirementGen =>
        from name in Gen.Choose(5, 50).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
            .Select(chars => new string(chars)))
        from description in Gen.Choose(10, 100).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
            .Select(chars => new string(chars)))
        from category in Gen.Elements(Enum.GetValues<ComplianceCategory>())
        from frequency in Gen.Elements(Enum.GetValues<ComplianceFrequency>())
        select new ComplianceRequirement
        {
            Name = name,
            Description = description,
            Category = category,
            Frequency = frequency,
            SourceRegulation = "Test Regulation",
            ResponsibleRole = "Legal_Compliance_Officer",
            Status = ComplianceRequirementStatus.Active
        };

    /// <summary>
    /// FsCheck generator for valid InsuranceRecord entities with random field values.
    /// </summary>
    private static Gen<InsuranceRecord> InsuranceRecordGen =>
        from policyNumber in Gen.Choose(3, 20).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-".ToCharArray()))
            .Select(chars => new string(chars)))
        from insurer in Gen.Choose(2, 50).SelectMany(len =>
            Gen.ArrayOf(len, Gen.Elements("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
            .Select(chars => new string(chars)))
        from coverageType in Gen.Elements(Enum.GetValues<CoverageType>())
        from coverAmount in Gen.Choose(1000, 1000000).Select(x => (decimal)x)
        from premium in Gen.Choose(100, 50000).Select(x => (decimal)x)
        select new InsuranceRecord
        {
            PolicyNumber = policyNumber,
            Insurer = insurer,
            CoverageType = coverageType,
            CoverAmount = coverAmount,
            Premium = premium,
            Currency = "GBP",
            StartDate = DateTime.UtcNow.AddMonths(-6),
            ExpiryDate = DateTime.UtcNow.AddMonths(6),
            Status = InsuranceStatus.Active
        };

    /// <summary>
    /// Combined generator producing one of the Legal Compliance entity types
    /// along with a random user context.
    /// </summary>
    private static Gen<(string UserId, string UserName, string CorrelationId, string Operation)> AuditContextGen =>
        from userId in UserIdGen
        from userName in UserNameGen
        from correlationId in CorrelationIdGen
        from operation in Gen.Elements("Create", "Update", "Delete")
        select (userId, userName, correlationId, operation);

    /// <summary>
    /// Property 22: Audit Entry Completeness — Create operations produce audit entries
    /// with all required fields non-null.
    ///
    /// For any randomly generated LegalCase creation, the AuditLog entry SHALL have
    /// non-null UserId, UserName, Action, EntityName, EntityId, Timestamp, and CorrelationId.
    ///
    /// **Validates: Requirements 13.1, 13.2, 13.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property CreateOperation_ProducesAuditEntryWithAllRequiredFieldsNonNull()
    {
        var gen = from userId in UserIdGen
                  from userName in UserNameGen
                  from correlationId in CorrelationIdGen
                  from legalCase in LegalCaseGen
                  select (userId, userName, correlationId, legalCase);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (userId, userName, correlationId, legalCase) = tuple;

            using var context = CreateDbContextWithInterceptor(userId, userName, correlationId);
            context.LegalCases.Add(legalCase);
            context.SaveChangesAsync().GetAwaiter().GetResult();

            var auditEntry = context.AuditLogs
                .FirstOrDefault(a => a.EntityId == legalCase.Id.ToString() && a.Action == "Create");

            var allFieldsPresent = auditEntry != null
                && !string.IsNullOrEmpty(auditEntry.UserId)
                && !string.IsNullOrEmpty(auditEntry.UserName)
                && !string.IsNullOrEmpty(auditEntry.Action)
                && !string.IsNullOrEmpty(auditEntry.EntityName)
                && !string.IsNullOrEmpty(auditEntry.EntityId)
                && auditEntry.Timestamp != default
                && !string.IsNullOrEmpty(auditEntry.CorrelationId);

            return allFieldsPresent
                .Label($"Create audit entry missing required fields. " +
                       $"UserId='{auditEntry?.UserId}', UserName='{auditEntry?.UserName}', " +
                       $"Action='{auditEntry?.Action}', EntityName='{auditEntry?.EntityName}', " +
                       $"EntityId='{auditEntry?.EntityId}', Timestamp='{auditEntry?.Timestamp}', " +
                       $"CorrelationId='{auditEntry?.CorrelationId}'");
        });
    }

    /// <summary>
    /// Property 22: Audit Entry Completeness — Update operations produce audit entries
    /// with all required fields non-null.
    ///
    /// For any randomly generated ComplianceRequirement update, the AuditLog entry SHALL have
    /// non-null UserId, UserName, Action, EntityName, EntityId, Timestamp, and CorrelationId.
    ///
    /// **Validates: Requirements 13.1, 13.2, 13.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property UpdateOperation_ProducesAuditEntryWithAllRequiredFieldsNonNull()
    {
        var gen = from userId in UserIdGen
                  from userName in UserNameGen
                  from correlationId in CorrelationIdGen
                  from requirement in ComplianceRequirementGen
                  from newName in Gen.Choose(5, 50).SelectMany(len =>
                      Gen.ArrayOf(len, Gen.Elements("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
                      .Select(chars => new string(chars)))
                  select (userId, userName, correlationId, requirement, newName);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (userId, userName, correlationId, requirement, newName) = tuple;

            using var context = CreateDbContextWithInterceptor(userId, userName, correlationId);

            // First create the entity
            context.ComplianceRequirements.Add(requirement);
            context.SaveChangesAsync().GetAwaiter().GetResult();

            // Now update it
            requirement.Name = newName;
            context.SaveChangesAsync().GetAwaiter().GetResult();

            var auditEntry = context.AuditLogs
                .FirstOrDefault(a => a.EntityId == requirement.Id.ToString() && a.Action == "Update");

            var allFieldsPresent = auditEntry != null
                && !string.IsNullOrEmpty(auditEntry.UserId)
                && !string.IsNullOrEmpty(auditEntry.UserName)
                && !string.IsNullOrEmpty(auditEntry.Action)
                && !string.IsNullOrEmpty(auditEntry.EntityName)
                && !string.IsNullOrEmpty(auditEntry.EntityId)
                && auditEntry.Timestamp != default
                && !string.IsNullOrEmpty(auditEntry.CorrelationId);

            return allFieldsPresent
                .Label($"Update audit entry missing required fields. " +
                       $"UserId='{auditEntry?.UserId}', UserName='{auditEntry?.UserName}', " +
                       $"Action='{auditEntry?.Action}', EntityName='{auditEntry?.EntityName}', " +
                       $"EntityId='{auditEntry?.EntityId}', Timestamp='{auditEntry?.Timestamp}', " +
                       $"CorrelationId='{auditEntry?.CorrelationId}'");
        });
    }

    /// <summary>
    /// Property 22: Audit Entry Completeness — Delete operations produce audit entries
    /// with all required fields non-null.
    ///
    /// For any randomly generated InsuranceRecord soft-delete (simulated via direct IsDeleted
    /// flag update as performed by application handlers), the AuditLog entry SHALL have
    /// non-null UserId, UserName, Action, EntityName, EntityId, Timestamp, and CorrelationId.
    ///
    /// **Validates: Requirements 13.1, 13.2, 13.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property DeleteOperation_ProducesAuditEntryWithAllRequiredFieldsNonNull()
    {
        var gen = from userId in UserIdGen
                  from userName in UserNameGen
                  from correlationId in CorrelationIdGen
                  from insurance in InsuranceRecordGen
                  select (userId, userName, correlationId, insurance);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (userId, userName, correlationId, insurance) = tuple;

            using var context = CreateDbContextWithInterceptor(userId, userName, correlationId);

            // First create the entity
            context.Set<InsuranceRecord>().Add(insurance);
            context.SaveChangesAsync().GetAwaiter().GetResult();

            // Simulate soft-delete as the application does it: set IsDeleted flag
            insurance.IsDeleted = true;
            insurance.DeletedAt = DateTime.UtcNow;
            insurance.DeletedBy = userId;
            context.SaveChangesAsync().GetAwaiter().GetResult();

            // The update that sets IsDeleted=true produces an "Update" audit entry
            var auditEntries = context.AuditLogs
                .Where(a => a.EntityId == insurance.Id.ToString())
                .OrderBy(a => a.Timestamp)
                .ToList();

            // Should have at least 2 entries: Create + Update (soft-delete)
            var deleteAuditEntry = auditEntries.LastOrDefault(a => a.Action == "Update");

            var allFieldsPresent = deleteAuditEntry != null
                && !string.IsNullOrEmpty(deleteAuditEntry.UserId)
                && !string.IsNullOrEmpty(deleteAuditEntry.UserName)
                && !string.IsNullOrEmpty(deleteAuditEntry.Action)
                && !string.IsNullOrEmpty(deleteAuditEntry.EntityName)
                && !string.IsNullOrEmpty(deleteAuditEntry.EntityId)
                && deleteAuditEntry.Timestamp != default
                && !string.IsNullOrEmpty(deleteAuditEntry.CorrelationId);

            return allFieldsPresent
                .Label($"Soft-delete audit entry missing required fields. " +
                       $"Total entries: {auditEntries.Count}. " +
                       $"UserId='{deleteAuditEntry?.UserId}', UserName='{deleteAuditEntry?.UserName}', " +
                       $"Action='{deleteAuditEntry?.Action}', EntityName='{deleteAuditEntry?.EntityName}', " +
                       $"EntityId='{deleteAuditEntry?.EntityId}', Timestamp='{deleteAuditEntry?.Timestamp}', " +
                       $"CorrelationId='{deleteAuditEntry?.CorrelationId}'");
        });
    }

    /// <summary>
    /// Property 22: Audit Entry Completeness — Mixed operations across different entity types
    /// all produce audit entries with the required non-null fields.
    ///
    /// For any random combination of operations on Legal Compliance entities, every resulting
    /// AuditLog entry SHALL have non-null UserId, UserName, Action, EntityName, EntityId,
    /// Timestamp, and CorrelationId.
    ///
    /// **Validates: Requirements 13.1, 13.2, 13.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property MixedOperations_AllAuditEntriesHaveRequiredFieldsNonNull()
    {
        var gen = from userId in UserIdGen
                  from userName in UserNameGen
                  from correlationId in CorrelationIdGen
                  from legalCase in LegalCaseGen
                  from requirement in ComplianceRequirementGen
                  from insurance in InsuranceRecordGen
                  select (userId, userName, correlationId, legalCase, requirement, insurance);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (userId, userName, correlationId, legalCase, requirement, insurance) = tuple;

            using var context = CreateDbContextWithInterceptor(userId, userName, correlationId);

            // Create multiple entities
            context.LegalCases.Add(legalCase);
            context.ComplianceRequirements.Add(requirement);
            context.Set<InsuranceRecord>().Add(insurance);
            context.SaveChangesAsync().GetAwaiter().GetResult();

            // Verify all audit entries have required fields
            var auditEntries = context.AuditLogs.ToList();

            var allEntriesComplete = auditEntries.All(entry =>
                !string.IsNullOrEmpty(entry.UserId)
                && !string.IsNullOrEmpty(entry.UserName)
                && !string.IsNullOrEmpty(entry.Action)
                && !string.IsNullOrEmpty(entry.EntityName)
                && !string.IsNullOrEmpty(entry.EntityId)
                && entry.Timestamp != default
                && !string.IsNullOrEmpty(entry.CorrelationId));

            var incompleteEntry = auditEntries.FirstOrDefault(entry =>
                string.IsNullOrEmpty(entry.UserId)
                || string.IsNullOrEmpty(entry.UserName)
                || string.IsNullOrEmpty(entry.Action)
                || string.IsNullOrEmpty(entry.EntityName)
                || string.IsNullOrEmpty(entry.EntityId)
                || entry.Timestamp == default
                || string.IsNullOrEmpty(entry.CorrelationId));

            return (auditEntries.Count >= 3 && allEntriesComplete)
                .Label($"Expected at least 3 complete audit entries but got {auditEntries.Count}. " +
                       (incompleteEntry != null
                           ? $"First incomplete: UserId='{incompleteEntry.UserId}', " +
                             $"UserName='{incompleteEntry.UserName}', Action='{incompleteEntry.Action}', " +
                             $"EntityName='{incompleteEntry.EntityName}', EntityId='{incompleteEntry.EntityId}', " +
                             $"Timestamp='{incompleteEntry.Timestamp}', CorrelationId='{incompleteEntry.CorrelationId}'"
                           : "All entries present but count insufficient."));
        });
    }
}
