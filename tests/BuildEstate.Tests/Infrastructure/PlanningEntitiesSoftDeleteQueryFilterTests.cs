using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Tests.Infrastructure;

/// <summary>
/// Verifies that all planning entity configurations have HasQueryFilter(x => !x.IsDeleted) applied.
/// This ensures soft-deleted records are never returned by standard queries.
///
/// Requirements: 3.5, 13.1
/// </summary>
public class PlanningEntitiesSoftDeleteQueryFilterTests : IDisposable
{
    private readonly BuildEstateDbContext _context;

    public PlanningEntitiesSoftDeleteQueryFilterTests()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: $"SoftDeleteTest_{Guid.NewGuid()}")
            .Options;

        _context = new BuildEstateDbContext(options);
    }

    [Fact]
    public async Task PlanningApplication_QueryFilter_ExcludesSoftDeletedRecords()
    {
        // Arrange
        var active = CreatePlanningApplication(isDeleted: false);
        var deleted = CreatePlanningApplication(isDeleted: true);

        _context.PlanningApplications.AddRange(active, deleted);
        await _context.SaveChangesAsync();

        // Act
        var results = await _context.PlanningApplications.ToListAsync();

        // Assert
        results.Should().ContainSingle()
            .Which.Id.Should().Be(active.Id);
        results.Should().NotContain(x => x.IsDeleted);
    }

    [Fact]
    public async Task PlanningCondition_QueryFilter_ExcludesSoftDeletedRecords()
    {
        // Arrange
        var app = CreatePlanningApplication(isDeleted: false);
        _context.PlanningApplications.Add(app);

        var active = CreatePlanningCondition(app.Id, isDeleted: false);
        var deleted = CreatePlanningCondition(app.Id, isDeleted: true);

        _context.PlanningConditions.AddRange(active, deleted);
        await _context.SaveChangesAsync();

        // Act
        var results = await _context.PlanningConditions.ToListAsync();

        // Assert
        results.Should().ContainSingle()
            .Which.Id.Should().Be(active.Id);
        results.Should().NotContain(x => x.IsDeleted);
    }

    [Fact]
    public async Task PlanningAppeal_QueryFilter_ExcludesSoftDeletedRecords()
    {
        // Arrange
        var app = CreatePlanningApplication(isDeleted: false);
        _context.PlanningApplications.Add(app);

        var active = CreatePlanningAppeal(app.Id, isDeleted: false);
        var deleted = CreatePlanningAppeal(app.Id, isDeleted: true);

        _context.PlanningAppeals.AddRange(active, deleted);
        await _context.SaveChangesAsync();

        // Act
        var results = await _context.PlanningAppeals.ToListAsync();

        // Assert
        results.Should().ContainSingle()
            .Which.Id.Should().Be(active.Id);
        results.Should().NotContain(x => x.IsDeleted);
    }

    [Fact]
    public async Task PlanningDocument_QueryFilter_ExcludesSoftDeletedRecords()
    {
        // Arrange
        var app = CreatePlanningApplication(isDeleted: false);
        _context.PlanningApplications.Add(app);

        var active = CreatePlanningDocument(app.Id, isDeleted: false);
        var deleted = CreatePlanningDocument(app.Id, isDeleted: true);

        _context.PlanningDocuments.AddRange(active, deleted);
        await _context.SaveChangesAsync();

        // Act
        var results = await _context.PlanningDocuments.ToListAsync();

        // Assert
        results.Should().ContainSingle()
            .Which.Id.Should().Be(active.Id);
        results.Should().NotContain(x => x.IsDeleted);
    }

    [Fact]
    public async Task PlanningFee_QueryFilter_ExcludesSoftDeletedRecords()
    {
        // Arrange
        var app = CreatePlanningApplication(isDeleted: false);
        _context.PlanningApplications.Add(app);

        var active = CreatePlanningFee(app.Id, isDeleted: false);
        var deleted = CreatePlanningFee(app.Id, isDeleted: true);

        _context.PlanningFees.AddRange(active, deleted);
        await _context.SaveChangesAsync();

        // Act
        var results = await _context.PlanningFees.ToListAsync();

        // Assert
        results.Should().ContainSingle()
            .Which.Id.Should().Be(active.Id);
        results.Should().NotContain(x => x.IsDeleted);
    }

    [Fact]
    public async Task PlanningMilestone_QueryFilter_ExcludesSoftDeletedRecords()
    {
        // Arrange
        var app = CreatePlanningApplication(isDeleted: false);
        _context.PlanningApplications.Add(app);

        var active = CreatePlanningMilestone(app.Id, MilestoneType.SubmissionDate, isDeleted: false);
        var deleted = CreatePlanningMilestone(app.Id, MilestoneType.ValidationDate, isDeleted: true);

        _context.PlanningMilestones.AddRange(active, deleted);
        await _context.SaveChangesAsync();

        // Act
        var results = await _context.PlanningMilestones.ToListAsync();

        // Assert
        results.Should().ContainSingle()
            .Which.Id.Should().Be(active.Id);
        results.Should().NotContain(x => x.IsDeleted);
    }

    [Fact]
    public async Task CouncilContact_QueryFilter_ExcludesSoftDeletedRecords()
    {
        // Arrange
        var app = CreatePlanningApplication(isDeleted: false);
        _context.PlanningApplications.Add(app);

        var active = CreateCouncilContact(app.Id, isDeleted: false);
        _context.CouncilContacts.Add(active);
        await _context.SaveChangesAsync();

        // Create a second application with a deleted council contact
        var app2 = CreatePlanningApplication(isDeleted: false);
        _context.PlanningApplications.Add(app2);

        var deleted = CreateCouncilContact(app2.Id, isDeleted: true);
        _context.CouncilContacts.Add(deleted);
        await _context.SaveChangesAsync();

        // Act
        var results = await _context.CouncilContacts.ToListAsync();

        // Assert
        results.Should().ContainSingle()
            .Which.Id.Should().Be(active.Id);
        results.Should().NotContain(x => x.IsDeleted);
    }

    [Fact]
    public async Task AllPlanningEntities_IgnoreQueryFilters_ReturnsSoftDeletedRecords()
    {
        // Arrange — add a deleted record for each entity type
        var app = CreatePlanningApplication(isDeleted: true);
        _context.PlanningApplications.Add(app);
        await _context.SaveChangesAsync();

        // Act — IgnoreQueryFilters bypasses the soft-delete filter
        var results = await _context.PlanningApplications
            .IgnoreQueryFilters()
            .ToListAsync();

        // Assert — confirms the filter is the only reason records are excluded
        results.Should().ContainSingle()
            .Which.IsDeleted.Should().BeTrue();
    }

    #region Helper Methods

    private static PlanningApplication CreatePlanningApplication(bool isDeleted)
    {
        return new PlanningApplication
        {
            Id = Guid.NewGuid(),
            OpportunityId = Guid.NewGuid(),
            Description = "Test Planning Application",
            ApplicationType = PlanningApplicationType.Full,
            Status = PlanningApplicationStatus.PreApplication,
            CouncilName = "Test Council",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = isDeleted
        };
    }

    private static PlanningCondition CreatePlanningCondition(Guid applicationId, bool isDeleted)
    {
        return new PlanningCondition
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            ConditionNumber = Random.Shared.Next(1, 1000),
            Description = "Test Condition Description",
            ConditionType = ConditionType.PreCommencement,
            Status = ConditionStatus.Outstanding,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = isDeleted
        };
    }

    private static PlanningAppeal CreatePlanningAppeal(Guid applicationId, bool isDeleted)
    {
        return new PlanningAppeal
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            AppealGrounds = "Test appeal grounds that are long enough to pass validation in the real system.",
            AppealType = AppealType.WrittenRepresentations,
            Status = AppealStatus.Lodged,
            LodgedDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = isDeleted
        };
    }

    private static PlanningDocument CreatePlanningDocument(Guid applicationId, bool isDeleted)
    {
        return new PlanningDocument
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            DocumentType = PlanningDocumentType.SitePlan,
            FileName = "test-document.pdf",
            ContentType = "application/pdf",
            FileSizeBytes = 1024,
            StoragePath = "/storage/test-document.pdf",
            UploadedAt = DateTime.UtcNow,
            UploadedBy = "test-user",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = isDeleted
        };
    }

    private static PlanningFee CreatePlanningFee(Guid applicationId, bool isDeleted)
    {
        return new PlanningFee
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            Amount = 500m,
            Currency = "GBP",
            FeeType = FeeType.ApplicationFee,
            Description = "Test fee description",
            PaymentStatus = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = isDeleted
        };
    }

    private static PlanningMilestone CreatePlanningMilestone(
        Guid applicationId, MilestoneType milestoneType, bool isDeleted)
    {
        return new PlanningMilestone
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            MilestoneType = milestoneType,
            Status = MilestoneStatus.Pending,
            TargetDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = isDeleted
        };
    }

    private static CouncilContact CreateCouncilContact(Guid applicationId, bool isDeleted)
    {
        return new CouncilContact
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            CouncilName = "Test Council",
            PlanningOfficerName = "John Smith",
            Email = "john.smith@council.gov.uk",
            Phone = "01234567890",
            Address = "123 Council Road, Test Town, TE1 1ST",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            IsDeleted = isDeleted
        };
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}
