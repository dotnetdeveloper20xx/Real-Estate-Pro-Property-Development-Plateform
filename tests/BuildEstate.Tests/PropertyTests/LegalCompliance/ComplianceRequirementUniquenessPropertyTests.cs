using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.CreateComplianceRequirement;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for uniqueness constraints on ComplianceRequirement.
///
/// Property 19: Uniqueness Constraints
/// For any ComplianceRequirement, no two active requirements SHALL have the same
/// (Name, Category) combination. Attempts to create duplicates SHALL be rejected
/// with a DuplicateEntityException. When Name is unique within Category, creation succeeds.
///
/// **Validates: Requirements 5.3**
/// </summary>
public class ComplianceRequirementUniquenessPropertyTests
{
    #region Generators

    /// <summary>
    /// FsCheck generator for valid Name strings (5-200 characters).
    /// </summary>
    private static Gen<string> ValidNameGen =>
        Gen.Choose(5, 50)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// FsCheck generator for valid ComplianceCategory enum values.
    /// </summary>
    private static Gen<ComplianceCategory> ValidCategoryGen =>
        Gen.Elements(Enum.GetValues<ComplianceCategory>());

    /// <summary>
    /// FsCheck generator for valid Description strings (10-200 characters).
    /// </summary>
    private static Gen<string> ValidDescriptionGen =>
        Gen.Choose(10, 60)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// FsCheck generator for valid SourceRegulation strings (3-300 characters).
    /// </summary>
    private static Gen<string> ValidSourceRegulationGen =>
        Gen.Choose(3, 50)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -/".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// FsCheck generator for valid ComplianceFrequency enum values.
    /// </summary>
    private static Gen<ComplianceFrequency> ValidFrequencyGen =>
        Gen.Elements(Enum.GetValues<ComplianceFrequency>());

    /// <summary>
    /// FsCheck generator for valid ResponsibleRole strings.
    /// </summary>
    private static Gen<string> ValidResponsibleRoleGen =>
        Gen.Elements(
            "Legal_Compliance_Officer",
            "Finance_Director",
            "Acquisition_Manager",
            "Admin_Support");

    /// <summary>
    /// FsCheck generator for valid CreateComplianceRequirementCommand instances.
    /// </summary>
    private static Gen<CreateComplianceRequirementCommand> ValidCommandGen =>
        from name in ValidNameGen
        from category in ValidCategoryGen
        from description in ValidDescriptionGen
        from sourceRegulation in ValidSourceRegulationGen
        from frequency in ValidFrequencyGen
        from responsibleRole in ValidResponsibleRoleGen
        select new CreateComplianceRequirementCommand
        {
            Name = name,
            Category = category,
            Description = description,
            SourceRegulation = sourceRegulation,
            Frequency = frequency,
            ResponsibleRole = responsibleRole
        };

    #endregion

    #region Property 19a: Duplicate Name+Category Is Always Rejected

    /// <summary>
    /// Property 19: Uniqueness Constraints — Duplicate Active Requirement Rejected
    ///
    /// For any random Name/Category pair, when an active ComplianceRequirement with the same
    /// Name and Category already exists, the handler SHALL throw a DuplicateEntityException.
    ///
    /// **Validates: Requirements 5.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateComplianceRequirement_WithDuplicateNameAndCategory_AlwaysThrows()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            // Arrange — simulate existing active requirement with same Name + Category
            var existingRequirement = new ComplianceRequirement
            {
                Id = Guid.NewGuid(),
                Name = command.Name,
                Category = command.Category,
                Description = "Existing requirement",
                SourceRegulation = "Existing regulation",
                Frequency = ComplianceFrequency.Annually,
                ResponsibleRole = "Legal_Compliance_Officer",
                Status = ComplianceRequirementStatus.Active,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                CreatedBy = "existing-user"
            };

            var handler = CreateHandler(
                existingRequirements: new List<ComplianceRequirement> { existingRequirement });

            // Act
            Func<Task> act = () => handler.Handle(command, CancellationToken.None);

            // Assert
            act.Should().ThrowAsync<DuplicateEntityException>().GetAwaiter().GetResult();

            return true;
        });
    }

    #endregion

    #region Property 19b: Unique Name Within Category Succeeds

    /// <summary>
    /// Property 19: Uniqueness Constraints — Unique Name Within Category Succeeds
    ///
    /// For any random Name/Category pair, when no active ComplianceRequirement with the same
    /// Name and Category exists, the handler SHALL succeed and produce an entity with Status = Active.
    ///
    /// **Validates: Requirements 5.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateComplianceRequirement_WithUniqueNameInCategory_Succeeds()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            // Arrange — no existing requirements (empty repository)
            ComplianceRequirement? capturedEntity = null;
            var handler = CreateHandler(
                existingRequirements: new List<ComplianceRequirement>(),
                onAdd: entity => capturedEntity = entity);

            // Act
            Func<Task> act = () => handler.Handle(command, CancellationToken.None);

            // Assert — should succeed without throwing
            act.Should().NotThrowAsync().GetAwaiter().GetResult();
            capturedEntity.Should().NotBeNull();
            capturedEntity!.Status.Should().Be(ComplianceRequirementStatus.Active);
            capturedEntity.Name.Should().Be(command.Name);
            capturedEntity.Category.Should().Be(command.Category);

            return true;
        });
    }

    #endregion

    #region Property 19c: Same Name Different Category Is Allowed

    /// <summary>
    /// Property 19: Uniqueness Constraints — Same Name, Different Category Is Allowed
    ///
    /// For any Name/Category pair, when an active requirement exists with the same Name but a
    /// different Category, creation SHALL succeed because uniqueness is scoped to Name+Category.
    ///
    /// **Validates: Requirements 5.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateComplianceRequirement_SameNameDifferentCategory_Succeeds()
    {
        var categoryPairGen =
            from cat1 in ValidCategoryGen
            from cat2 in ValidCategoryGen
            where cat1 != cat2
            select (cat1, cat2);

        return Prop.ForAll(
            ValidCommandGen.ToArbitrary(),
            categoryPairGen.ToArbitrary(),
            (command, categoryPair) =>
            {
                // Use the first category for the existing requirement, second for the new command
                var existingRequirement = new ComplianceRequirement
                {
                    Id = Guid.NewGuid(),
                    Name = command.Name,
                    Category = categoryPair.cat1,
                    Description = "Existing requirement",
                    SourceRegulation = "Existing regulation",
                    Frequency = ComplianceFrequency.Monthly,
                    ResponsibleRole = "Legal_Compliance_Officer",
                    Status = ComplianceRequirementStatus.Active,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    CreatedBy = "existing-user"
                };

                var modifiedCommand = new CreateComplianceRequirementCommand
                {
                    Name = command.Name,
                    Category = categoryPair.cat2,
                    Description = command.Description,
                    SourceRegulation = command.SourceRegulation,
                    Frequency = command.Frequency,
                    ResponsibleRole = command.ResponsibleRole
                };

                ComplianceRequirement? capturedEntity = null;
                var handler = CreateHandler(
                    existingRequirements: new List<ComplianceRequirement> { existingRequirement },
                    onAdd: entity => capturedEntity = entity);

                // Act
                Func<Task> act = () => handler.Handle(modifiedCommand, CancellationToken.None);

                // Assert — should succeed
                act.Should().NotThrowAsync().GetAwaiter().GetResult();
                capturedEntity.Should().NotBeNull();
                capturedEntity!.Name.Should().Be(command.Name);
                capturedEntity.Category.Should().Be(categoryPair.cat2);

                return true;
            });
    }

    #endregion

    #region Property 19d: Retired Requirement Does Not Block New Creation

    /// <summary>
    /// Property 19: Uniqueness Constraints — Retired Requirement Does Not Block
    ///
    /// When an existing requirement with the same Name+Category has been retired (Status != Active),
    /// creation of a new active requirement with the same Name+Category SHALL succeed.
    ///
    /// **Validates: Requirements 5.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateComplianceRequirement_RetiredDuplicateExists_Succeeds()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            // Arrange — existing requirement with same Name+Category but Retired status
            var retiredRequirement = new ComplianceRequirement
            {
                Id = Guid.NewGuid(),
                Name = command.Name,
                Category = command.Category,
                Description = "Retired requirement",
                SourceRegulation = "Old regulation",
                Frequency = ComplianceFrequency.Quarterly,
                ResponsibleRole = "Legal_Compliance_Officer",
                Status = ComplianceRequirementStatus.Retired,
                RetirementReason = "Superseded by new regulation",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow.AddDays(-90),
                CreatedBy = "old-user"
            };

            ComplianceRequirement? capturedEntity = null;
            var handler = CreateHandler(
                existingRequirements: new List<ComplianceRequirement> { retiredRequirement },
                onAdd: entity => capturedEntity = entity);

            // Act
            Func<Task> act = () => handler.Handle(command, CancellationToken.None);

            // Assert — should succeed because the existing one is retired
            act.Should().NotThrowAsync().GetAwaiter().GetResult();
            capturedEntity.Should().NotBeNull();
            capturedEntity!.Status.Should().Be(ComplianceRequirementStatus.Active);

            return true;
        });
    }

    #endregion

    #region Test Helpers

    private static CreateComplianceRequirementCommandHandler CreateHandler(
        List<ComplianceRequirement> existingRequirements,
        Action<ComplianceRequirement>? onAdd = null)
    {
        var repositoryMock = new Mock<IRepository<ComplianceRequirement>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();

        // Setup repository Query() to return existing requirements for uniqueness check
        repositoryMock
            .Setup(r => r.Query())
            .Returns(existingRequirements.AsAsyncQueryable());

        // Capture added entity for assertions
        repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<ComplianceRequirement>(), It.IsAny<CancellationToken>()))
            .Callback<ComplianceRequirement, CancellationToken>((entity, _) => onAdd?.Invoke(entity))
            .Returns(Task.CompletedTask);

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<ComplianceRequirementDto>(It.IsAny<ComplianceRequirement>()))
            .Returns((ComplianceRequirement entity) => new ComplianceRequirementDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Category = entity.Category,
                Description = entity.Description,
                SourceRegulation = entity.SourceRegulation,
                Frequency = entity.Frequency,
                ResponsibleRole = entity.ResponsibleRole,
                Status = entity.Status,
                RetirementReason = entity.RetirementReason,
                NextDueDate = entity.NextDueDate,
                CreatedAt = entity.CreatedAt,
                CreatedBy = entity.CreatedBy
            });

        return new CreateComplianceRequirementCommandHandler(
            repositoryMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object);
    }

    #endregion
}
