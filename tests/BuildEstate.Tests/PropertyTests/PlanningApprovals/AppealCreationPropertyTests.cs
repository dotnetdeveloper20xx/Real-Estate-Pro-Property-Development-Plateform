using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.CreateAppeal;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for appeal creation validating that appeals can only be created
/// against applications with Status = Refused, that no active appeal already exists,
/// and that successful creation always produces Status = Lodged with LodgedDate set.
///
/// **Validates: Requirements 6.1, 6.2, 6.4**
/// </summary>
public class AppealCreationPropertyTests
{
    #region Property 10a: Only Refused Applications Allow Appeal Creation

    /// <summary>
    /// Property 10a: For any PlanningApplication with a Status OTHER THAN Refused,
    /// attempting to create a PlanningAppeal SHALL be rejected with a
    /// BusinessRuleViolationException.
    ///
    /// **Validates: Requirements 6.1, 6.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AppealCreation_WithNonRefusedStatus_AlwaysFails()
    {
        var nonRefusedStatuses = Enum.GetValues<PlanningApplicationStatus>()
            .Where(s => s != PlanningApplicationStatus.Refused)
            .ToArray();

        return Prop.ForAll(
            Gen.Elements(nonRefusedStatuses).ToArbitrary(),
            status =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, status);
                var handler = CreateHandler(application, existingAppeals: new List<PlanningAppeal>());

                var command = new CreateAppealCommand
                {
                    ApplicationId = applicationId,
                    AppealGrounds = new string('g', 100), // Valid length (50-5000)
                    AppealType = AppealType.WrittenRepresentations
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("AppealRequiresRefusedApplication");

                return true;
            });
    }

    /// <summary>
    /// Property 10a (continued): Exhaustive verification across ALL PlanningApplicationStatus values.
    /// Appeal creation succeeds if and only if status == Refused.
    ///
    /// **Validates: Requirements 6.1, 6.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AppealCreation_OnlyRefusedStatus_AllowsCreation()
    {
        var allStatuses = Enum.GetValues<PlanningApplicationStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            status =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, status);
                var handler = CreateHandler(application, existingAppeals: new List<PlanningAppeal>());

                var command = new CreateAppealCommand
                {
                    ApplicationId = applicationId,
                    AppealGrounds = new string('g', 100), // Valid length (50-5000)
                    AppealType = AppealType.Hearing
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                if (status == PlanningApplicationStatus.Refused)
                {
                    act.Should().NotThrowAsync().GetAwaiter().GetResult();
                }
                else
                {
                    act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();
                }

                return true;
            });
    }

    #endregion

    #region Property 10b: Active Appeal Prevents New Appeal Creation

    /// <summary>
    /// Property 10b: If an active appeal (Status NOT in {Dismissed, Closed}) exists for the
    /// application, creating another appeal SHALL be rejected with a DuplicateEntityException.
    ///
    /// **Validates: Requirements 6.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AppealCreation_WithActiveAppealExisting_AlwaysFails()
    {
        // Active appeal statuses = all statuses except Dismissed and Closed
        var activeAppealStatuses = Enum.GetValues<AppealStatus>()
            .Where(s => s != AppealStatus.Dismissed && s != AppealStatus.Closed)
            .ToArray();

        return Prop.ForAll(
            Gen.Elements(activeAppealStatuses).ToArbitrary(),
            existingAppealStatus =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, PlanningApplicationStatus.Refused);

                var existingAppeal = new PlanningAppeal
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = applicationId,
                    AppealGrounds = "Existing appeal grounds that are sufficiently long for validation",
                    AppealType = AppealType.WrittenRepresentations,
                    Status = existingAppealStatus,
                    LodgedDate = DateTime.UtcNow.AddDays(-10),
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    CreatedBy = "existing-user"
                };

                var handler = CreateHandler(application, existingAppeals: new List<PlanningAppeal> { existingAppeal });

                var command = new CreateAppealCommand
                {
                    ApplicationId = applicationId,
                    AppealGrounds = new string('g', 100),
                    AppealType = AppealType.PublicInquiry
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<DuplicateEntityException>().GetAwaiter().GetResult();

                return true;
            });
    }

    /// <summary>
    /// Property 10b (continued): If the only existing appeals have Status in {Dismissed, Closed},
    /// creating a new appeal SHALL succeed.
    ///
    /// **Validates: Requirements 6.4**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AppealCreation_WithOnlyDismissedOrClosedAppeals_Succeeds()
    {
        var inactiveAppealStatuses = new[] { AppealStatus.Dismissed, AppealStatus.Closed };

        return Prop.ForAll(
            Gen.Elements(inactiveAppealStatuses).ToArbitrary(),
            existingAppealStatus =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, PlanningApplicationStatus.Refused);

                var existingAppeal = new PlanningAppeal
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = applicationId,
                    AppealGrounds = "Previous appeal grounds that were previously dismissed or closed",
                    AppealType = AppealType.Hearing,
                    Status = existingAppealStatus,
                    LodgedDate = DateTime.UtcNow.AddDays(-60),
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-60),
                    CreatedBy = "previous-user"
                };

                PlanningAppeal? capturedAppeal = null;
                var handler = CreateHandler(
                    application,
                    existingAppeals: new List<PlanningAppeal> { existingAppeal },
                    onAdd: appeal => capturedAppeal = appeal);

                var command = new CreateAppealCommand
                {
                    ApplicationId = applicationId,
                    AppealGrounds = new string('g', 100),
                    AppealType = AppealType.PublicInquiry
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should succeed
                act.Should().NotThrowAsync().GetAwaiter().GetResult();
                capturedAppeal.Should().NotBeNull();
                capturedAppeal!.Status.Should().Be(AppealStatus.Lodged);

                return true;
            });
    }

    #endregion

    #region Property 10c: Successful Creation Produces Lodged Status with LodgedDate

    /// <summary>
    /// Property 10c: Successful appeal creation SHALL always produce an appeal with
    /// Status = Lodged and LodgedDate set to a value close to UTC now.
    ///
    /// **Validates: Requirements 6.1, 6.4**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AppealCreation_WhenSuccessful_AlwaysProducesLodgedStatusWithLodgedDate()
    {
        var appealTypeGen = Gen.Elements(Enum.GetValues<AppealType>());

        return Prop.ForAll(
            appealTypeGen.ToArbitrary(),
            appealType =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, PlanningApplicationStatus.Refused);
                var beforeCreation = DateTime.UtcNow;

                PlanningAppeal? capturedAppeal = null;
                var handler = CreateHandler(
                    application,
                    existingAppeals: new List<PlanningAppeal>(),
                    onAdd: appeal => capturedAppeal = appeal);

                var command = new CreateAppealCommand
                {
                    ApplicationId = applicationId,
                    AppealGrounds = new string('g', 100),
                    AppealType = appealType
                };

                // Act
                handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                capturedAppeal.Should().NotBeNull();
                capturedAppeal!.Status.Should().Be(AppealStatus.Lodged,
                    "newly created appeals must always have Status = Lodged");
                capturedAppeal.LodgedDate.Should().BeOnOrAfter(beforeCreation,
                    "LodgedDate must be set to UTC now at creation time");
                capturedAppeal.LodgedDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5),
                    "LodgedDate should be approximately current UTC time");
                capturedAppeal.ApplicationId.Should().Be(applicationId);
                capturedAppeal.AppealType.Should().Be(appealType);

                return true;
            });
    }

    #endregion

    #region Test Helpers

    private static PlanningApplication CreateApplication(Guid applicationId, PlanningApplicationStatus status)
    {
        return new PlanningApplication
        {
            Id = applicationId,
            OpportunityId = Guid.NewGuid(),
            Description = "Test Planning Application",
            ApplicationType = PlanningApplicationType.Full,
            Status = status,
            CouncilName = "Test Council",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user"
        };
    }

    private static CreateAppealCommandHandler CreateHandler(
        PlanningApplication application,
        List<PlanningAppeal> existingAppeals,
        Action<PlanningAppeal>? onAdd = null)
    {
        var applicationRepoMock = new Mock<IRepository<PlanningApplication>>();
        var appealRepoMock = new Mock<IRepository<PlanningAppeal>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();

        // Setup application repository to return the test application by Id
        applicationRepoMock
            .Setup(r => r.GetByIdAsync(application.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(application);

        // Setup appeal repository Query() to return existing appeals
        appealRepoMock
            .Setup(r => r.Query())
            .Returns(existingAppeals.AsAsyncQueryable());

        // Capture added appeal for assertion
        appealRepoMock
            .Setup(r => r.AddAsync(It.IsAny<PlanningAppeal>(), It.IsAny<CancellationToken>()))
            .Callback<PlanningAppeal, CancellationToken>((appeal, _) => onAdd?.Invoke(appeal))
            .Returns(Task.CompletedTask);

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<AppealDto>(It.IsAny<PlanningAppeal>()))
            .Returns((PlanningAppeal a) => new AppealDto
            {
                Id = a.Id,
                ApplicationId = a.ApplicationId,
                AppealGrounds = a.AppealGrounds,
                AppealType = a.AppealType.ToString(),
                Status = a.Status.ToString(),
                LodgedDate = a.LodgedDate,
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedBy
            });

        return new CreateAppealCommandHandler(
            applicationRepoMock.Object,
            appealRepoMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object);
    }

    #endregion
}
