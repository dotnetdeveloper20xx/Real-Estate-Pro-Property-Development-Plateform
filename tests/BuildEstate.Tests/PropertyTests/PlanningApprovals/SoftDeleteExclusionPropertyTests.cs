using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests verifying that the EF Core query filter (HasQueryFilter(x => !x.IsDeleted))
/// consistently excludes soft-deleted records from standard queries across all 7 planning entity types.
/// Uses FsCheck to generate random IsDeleted boolean values for batches of records, feeding them into
/// an InMemory DbContext and verifying that queries without IgnoreQueryFilters never return deleted records.
///
/// **Validates: Requirements 3.5**
/// </summary>
public class SoftDeleteExclusionPropertyTests : IDisposable
{
    private readonly BuildEstateDbContext _context;

    public SoftDeleteExclusionPropertyTests()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: $"SoftDeletePropertyTest_{Guid.NewGuid()}")
            .Options;

        _context = new BuildEstateDbContext(options);
    }

    /// <summary>
    /// Property 18: Soft-Delete Exclusion — PlanningApplication
    ///
    /// For any set of PlanningApplication records with randomly generated IsDeleted values,
    /// standard queries SHALL never return any record with IsDeleted = true.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PlanningApplication_Query_NeverReturnsDeletedRecords()
    {
        var isDeletedListGen = GenerateIsDeletedList();

        return Prop.ForAll(
            isDeletedListGen.ToArbitrary(),
            isDeletedValues =>
            {
                // Arrange — create a fresh context per test to avoid cross-test state
                using var context = CreateFreshContext();

                var records = isDeletedValues.Select(isDeleted => new PlanningApplication
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = Guid.NewGuid(),
                    Description = "Property test application",
                    ApplicationType = PlanningApplicationType.Full,
                    Status = PlanningApplicationStatus.PreApplication,
                    CouncilName = "Test Council",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "test-user",
                    IsDeleted = isDeleted
                }).ToList();

                context.PlanningApplications.AddRange(records);
                context.SaveChanges();

                // Act
                var results = context.PlanningApplications.ToList();

                // Assert — no deleted records returned
                var expectedCount = isDeletedValues.Count(v => !v);
                results.Should().HaveCount(expectedCount);
                results.Should().NotContain(x => x.IsDeleted);

                return true;
            });
    }

    /// <summary>
    /// Property 18: Soft-Delete Exclusion — PlanningCondition
    ///
    /// For any set of PlanningCondition records with randomly generated IsDeleted values,
    /// standard queries SHALL never return any record with IsDeleted = true.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PlanningCondition_Query_NeverReturnsDeletedRecords()
    {
        var isDeletedListGen = GenerateIsDeletedList();

        return Prop.ForAll(
            isDeletedListGen.ToArbitrary(),
            isDeletedValues =>
            {
                using var context = CreateFreshContext();

                var app = CreateActiveApplication(context);
                var conditionNumber = 1;

                var records = isDeletedValues.Select(isDeleted => new PlanningCondition
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = app.Id,
                    ConditionNumber = conditionNumber++,
                    Description = "Property test condition",
                    ConditionType = ConditionType.PreCommencement,
                    Status = ConditionStatus.Outstanding,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "test-user",
                    IsDeleted = isDeleted
                }).ToList();

                context.PlanningConditions.AddRange(records);
                context.SaveChanges();

                // Act
                var results = context.PlanningConditions.ToList();

                // Assert
                var expectedCount = isDeletedValues.Count(v => !v);
                results.Should().HaveCount(expectedCount);
                results.Should().NotContain(x => x.IsDeleted);

                return true;
            });
    }

    /// <summary>
    /// Property 18: Soft-Delete Exclusion — PlanningAppeal
    ///
    /// For any set of PlanningAppeal records with randomly generated IsDeleted values,
    /// standard queries SHALL never return any record with IsDeleted = true.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PlanningAppeal_Query_NeverReturnsDeletedRecords()
    {
        var isDeletedListGen = GenerateIsDeletedList();

        return Prop.ForAll(
            isDeletedListGen.ToArbitrary(),
            isDeletedValues =>
            {
                using var context = CreateFreshContext();

                var app = CreateActiveApplication(context);

                var records = isDeletedValues.Select(isDeleted => new PlanningAppeal
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = app.Id,
                    AppealGrounds = "Property test appeal grounds that are long enough for validation purposes.",
                    AppealType = AppealType.WrittenRepresentations,
                    Status = AppealStatus.Lodged,
                    LodgedDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "test-user",
                    IsDeleted = isDeleted
                }).ToList();

                context.PlanningAppeals.AddRange(records);
                context.SaveChanges();

                // Act
                var results = context.PlanningAppeals.ToList();

                // Assert
                var expectedCount = isDeletedValues.Count(v => !v);
                results.Should().HaveCount(expectedCount);
                results.Should().NotContain(x => x.IsDeleted);

                return true;
            });
    }

    /// <summary>
    /// Property 18: Soft-Delete Exclusion — PlanningDocument
    ///
    /// For any set of PlanningDocument records with randomly generated IsDeleted values,
    /// standard queries SHALL never return any record with IsDeleted = true.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PlanningDocument_Query_NeverReturnsDeletedRecords()
    {
        var isDeletedListGen = GenerateIsDeletedList();

        return Prop.ForAll(
            isDeletedListGen.ToArbitrary(),
            isDeletedValues =>
            {
                using var context = CreateFreshContext();

                var app = CreateActiveApplication(context);

                var records = isDeletedValues.Select(isDeleted => new PlanningDocument
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = app.Id,
                    DocumentType = PlanningDocumentType.SitePlan,
                    FileName = "test-doc.pdf",
                    ContentType = "application/pdf",
                    FileSizeBytes = 1024,
                    StoragePath = "/storage/test-doc.pdf",
                    UploadedAt = DateTime.UtcNow,
                    UploadedBy = "test-user",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "test-user",
                    IsDeleted = isDeleted
                }).ToList();

                context.PlanningDocuments.AddRange(records);
                context.SaveChanges();

                // Act
                var results = context.PlanningDocuments.ToList();

                // Assert
                var expectedCount = isDeletedValues.Count(v => !v);
                results.Should().HaveCount(expectedCount);
                results.Should().NotContain(x => x.IsDeleted);

                return true;
            });
    }

    /// <summary>
    /// Property 18: Soft-Delete Exclusion — PlanningFee
    ///
    /// For any set of PlanningFee records with randomly generated IsDeleted values,
    /// standard queries SHALL never return any record with IsDeleted = true.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PlanningFee_Query_NeverReturnsDeletedRecords()
    {
        var isDeletedListGen = GenerateIsDeletedList();

        return Prop.ForAll(
            isDeletedListGen.ToArbitrary(),
            isDeletedValues =>
            {
                using var context = CreateFreshContext();

                var app = CreateActiveApplication(context);

                var records = isDeletedValues.Select(isDeleted => new PlanningFee
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = app.Id,
                    Amount = 500m,
                    Currency = "GBP",
                    FeeType = FeeType.ApplicationFee,
                    Description = "Property test fee",
                    PaymentStatus = PaymentStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "test-user",
                    IsDeleted = isDeleted
                }).ToList();

                context.PlanningFees.AddRange(records);
                context.SaveChanges();

                // Act
                var results = context.PlanningFees.ToList();

                // Assert
                var expectedCount = isDeletedValues.Count(v => !v);
                results.Should().HaveCount(expectedCount);
                results.Should().NotContain(x => x.IsDeleted);

                return true;
            });
    }

    /// <summary>
    /// Property 18: Soft-Delete Exclusion — PlanningMilestone
    ///
    /// For any set of PlanningMilestone records with randomly generated IsDeleted values,
    /// standard queries SHALL never return any record with IsDeleted = true.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property PlanningMilestone_Query_NeverReturnsDeletedRecords()
    {
        var isDeletedListGen = GenerateIsDeletedList();

        return Prop.ForAll(
            isDeletedListGen.ToArbitrary(),
            isDeletedValues =>
            {
                using var context = CreateFreshContext();

                // Each milestone gets its own application to avoid unique constraint on (ApplicationId, MilestoneType)
                var records = isDeletedValues.Select(isDeleted =>
                {
                    var app = new PlanningApplication
                    {
                        Id = Guid.NewGuid(),
                        OpportunityId = Guid.NewGuid(),
                        Description = "App for milestone test",
                        ApplicationType = PlanningApplicationType.Full,
                        Status = PlanningApplicationStatus.PreApplication,
                        CouncilName = "Test Council",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "test-user",
                        IsDeleted = false
                    };
                    context.PlanningApplications.Add(app);

                    return new PlanningMilestone
                    {
                        Id = Guid.NewGuid(),
                        ApplicationId = app.Id,
                        MilestoneType = MilestoneType.SubmissionDate,
                        Status = MilestoneStatus.Pending,
                        TargetDate = DateTime.UtcNow.AddDays(30),
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "test-user",
                        IsDeleted = isDeleted
                    };
                }).ToList();

                context.PlanningMilestones.AddRange(records);
                context.SaveChanges();

                // Act
                var results = context.PlanningMilestones.ToList();

                // Assert
                var expectedCount = isDeletedValues.Count(v => !v);
                results.Should().HaveCount(expectedCount);
                results.Should().NotContain(x => x.IsDeleted);

                return true;
            });
    }

    /// <summary>
    /// Property 18: Soft-Delete Exclusion — CouncilContact
    ///
    /// For any set of CouncilContact records with randomly generated IsDeleted values,
    /// standard queries SHALL never return any record with IsDeleted = true.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property CouncilContact_Query_NeverReturnsDeletedRecords()
    {
        var isDeletedListGen = GenerateIsDeletedList();

        return Prop.ForAll(
            isDeletedListGen.ToArbitrary(),
            isDeletedValues =>
            {
                using var context = CreateFreshContext();

                // Each CouncilContact needs its own application (one-to-one)
                var records = isDeletedValues.Select(isDeleted =>
                {
                    var app = new PlanningApplication
                    {
                        Id = Guid.NewGuid(),
                        OpportunityId = Guid.NewGuid(),
                        Description = "App for council contact",
                        ApplicationType = PlanningApplicationType.Full,
                        Status = PlanningApplicationStatus.PreApplication,
                        CouncilName = "Test Council",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "test-user",
                        IsDeleted = false
                    };
                    context.PlanningApplications.Add(app);

                    return new CouncilContact
                    {
                        Id = Guid.NewGuid(),
                        ApplicationId = app.Id,
                        CouncilName = "Test Council",
                        PlanningOfficerName = "John Smith",
                        Email = "john@council.gov.uk",
                        Phone = "01234567890",
                        Address = "123 Council Road, Test Town, TE1 1ST",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "test-user",
                        IsDeleted = isDeleted
                    };
                }).ToList();

                context.CouncilContacts.AddRange(records);
                context.SaveChanges();

                // Act
                var results = context.CouncilContacts.ToList();

                // Assert
                var expectedCount = isDeletedValues.Count(v => !v);
                results.Should().HaveCount(expectedCount);
                results.Should().NotContain(x => x.IsDeleted);

                return true;
            });
    }

    #region Generators

    /// <summary>
    /// Generates a list of 2 to 10 random boolean values representing IsDeleted flags.
    /// Always includes at least one true and one false for meaningful property testing,
    /// by prepending one of each and then appending additional random values.
    /// </summary>
    private static Gen<List<bool>> GenerateIsDeletedList()
    {
        // Generate 0 to 8 additional random booleans, then prepend one true + one false
        return Gen.Choose(0, 8).SelectMany(extraCount =>
            Gen.ListOf(extraCount, Arb.Generate<bool>())
                .Select(extras =>
                {
                    var result = new List<bool> { true, false };
                    result.AddRange(extras);
                    return result;
                }));
    }

    #endregion

    #region Helpers

    private BuildEstateDbContext CreateFreshContext()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: $"SoftDeletePropertyTest_{Guid.NewGuid()}")
            .Options;

        return new BuildEstateDbContext(options);
    }

    private static PlanningApplication CreateActiveApplication(BuildEstateDbContext context)
    {
        var app = new PlanningApplication
        {
            Id = Guid.NewGuid(),
            OpportunityId = Guid.NewGuid(),
            Description = "Parent application for property test",
            ApplicationType = PlanningApplicationType.Full,
            Status = PlanningApplicationStatus.PreApplication,
            CouncilName = "Test Council",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = false
        };

        context.PlanningApplications.Add(app);
        context.SaveChanges();
        return app;
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}
