using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CreateMilestone;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
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
/// Property-based tests for milestone type uniqueness per application.
/// Validates that attempting to create a PlanningMilestone with a MilestoneType that already
/// exists for that application is rejected with a DuplicateEntityException.
///
/// **Validates: Requirements 9.3**
/// </summary>
public class MilestoneUniquenessPropertyTests
{
    #region Property 13a: Duplicate MilestoneType Is Always Rejected

    /// <summary>
    /// Property 13: Milestone Type Uniqueness Per Application
    ///
    /// For any PlanningApplication, attempting to create a PlanningMilestone with a MilestoneType
    /// that already exists for that application SHALL be rejected with a DuplicateEntityException.
    ///
    /// **Validates: Requirements 9.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property MilestoneCreation_WithDuplicateMilestoneType_AlwaysFails()
    {
        var allMilestoneTypes = Enum.GetValues<MilestoneType>();

        return Prop.ForAll(
            Gen.Elements(allMilestoneTypes).ToArbitrary(),
            milestoneType =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId);

                // Simulate an existing milestone with the same type
                var existingMilestone = new PlanningMilestone
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = applicationId,
                    MilestoneType = milestoneType,
                    Status = MilestoneStatus.Pending,
                    TargetDate = DateTime.UtcNow.AddDays(30),
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    CreatedBy = "existing-user"
                };

                var handler = CreateHandler(
                    application,
                    existingMilestones: new List<PlanningMilestone> { existingMilestone });

                var command = new CreateMilestoneCommand
                {
                    ApplicationId = applicationId,
                    MilestoneType = milestoneType,
                    TargetDate = DateTime.UtcNow.AddDays(60)
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<DuplicateEntityException>().GetAwaiter().GetResult();

                return true;
            });
    }

    #endregion

    #region Property 13b: No Duplicate Allows Creation

    /// <summary>
    /// Property 13 (continued): When no milestone with the same MilestoneType exists for the
    /// application, creation SHALL succeed and produce a milestone with Status = Pending.
    ///
    /// **Validates: Requirements 9.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property MilestoneCreation_WithNoExistingDuplicate_Succeeds()
    {
        var allMilestoneTypes = Enum.GetValues<MilestoneType>();

        return Prop.ForAll(
            Gen.Elements(allMilestoneTypes).ToArbitrary(),
            milestoneType =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId);

                PlanningMilestone? capturedMilestone = null;
                var handler = CreateHandler(
                    application,
                    existingMilestones: new List<PlanningMilestone>(),
                    onAdd: m => capturedMilestone = m);

                var command = new CreateMilestoneCommand
                {
                    ApplicationId = applicationId,
                    MilestoneType = milestoneType,
                    TargetDate = DateTime.UtcNow.AddDays(30)
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should succeed
                act.Should().NotThrowAsync().GetAwaiter().GetResult();
                capturedMilestone.Should().NotBeNull();
                capturedMilestone!.Status.Should().Be(MilestoneStatus.Pending,
                    "newly created milestones must always have Status = Pending");
                capturedMilestone.MilestoneType.Should().Be(milestoneType);
                capturedMilestone.ApplicationId.Should().Be(applicationId);

                return true;
            });
    }

    #endregion

    #region Property 13c: Exhaustive Uniqueness Enforcement Across All MilestoneType Values

    /// <summary>
    /// Property 13 (continued): Generate all possible MilestoneType values and verify
    /// uniqueness enforcement. For each MilestoneType, if a milestone already exists
    /// with that type, creation fails; if no duplicate exists, creation succeeds.
    ///
    /// **Validates: Requirements 9.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property MilestoneCreation_UniquenessEnforcement_AcrossAllTypes()
    {
        var allMilestoneTypes = Enum.GetValues<MilestoneType>();

        return Prop.ForAll(
            Gen.Elements(allMilestoneTypes).ToArbitrary(),
            Gen.Elements(true, false).ToArbitrary(),
            (milestoneType, duplicateExists) =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId);

                var existingMilestones = new List<PlanningMilestone>();
                if (duplicateExists)
                {
                    existingMilestones.Add(new PlanningMilestone
                    {
                        Id = Guid.NewGuid(),
                        ApplicationId = applicationId,
                        MilestoneType = milestoneType,
                        Status = MilestoneStatus.Pending,
                        TargetDate = DateTime.UtcNow.AddDays(15),
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow.AddDays(-3),
                        CreatedBy = "existing-user"
                    });
                }

                PlanningMilestone? capturedMilestone = null;
                var handler = CreateHandler(
                    application,
                    existingMilestones: existingMilestones,
                    onAdd: m => capturedMilestone = m);

                var command = new CreateMilestoneCommand
                {
                    ApplicationId = applicationId,
                    MilestoneType = milestoneType,
                    TargetDate = DateTime.UtcNow.AddDays(45)
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                if (duplicateExists)
                {
                    act.Should().ThrowAsync<DuplicateEntityException>().GetAwaiter().GetResult();
                }
                else
                {
                    act.Should().NotThrowAsync().GetAwaiter().GetResult();
                    capturedMilestone.Should().NotBeNull();
                    capturedMilestone!.MilestoneType.Should().Be(milestoneType);
                    capturedMilestone.Status.Should().Be(MilestoneStatus.Pending);
                }

                return true;
            });
    }

    #endregion

    #region Test Helpers

    private static PlanningApplication CreateApplication(Guid applicationId)
    {
        return new PlanningApplication
        {
            Id = applicationId,
            OpportunityId = Guid.NewGuid(),
            Description = "Test Planning Application",
            ApplicationType = PlanningApplicationType.Full,
            Status = PlanningApplicationStatus.Submitted,
            CouncilName = "Test Council",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user"
        };
    }

    private static CreateMilestoneCommandHandler CreateHandler(
        PlanningApplication application,
        List<PlanningMilestone> existingMilestones,
        Action<PlanningMilestone>? onAdd = null)
    {
        var applicationRepoMock = new Mock<IRepository<PlanningApplication>>();
        var milestoneRepoMock = new Mock<IRepository<PlanningMilestone>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();

        // Setup application repository to return the test application by Id
        applicationRepoMock
            .Setup(r => r.GetByIdAsync(application.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(application);

        // Setup milestone repository Query() to return existing milestones
        milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(existingMilestones.AsAsyncQueryable());

        // Capture added milestone for assertion
        milestoneRepoMock
            .Setup(r => r.AddAsync(It.IsAny<PlanningMilestone>(), It.IsAny<CancellationToken>()))
            .Callback<PlanningMilestone, CancellationToken>((milestone, _) => onAdd?.Invoke(milestone))
            .Returns(Task.CompletedTask);

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<MilestoneDto>(It.IsAny<PlanningMilestone>()))
            .Returns((PlanningMilestone ms) => new MilestoneDto
            {
                Id = ms.Id,
                ApplicationId = ms.ApplicationId,
                MilestoneType = ms.MilestoneType.ToString(),
                Status = ms.Status.ToString(),
                TargetDate = ms.TargetDate,
                ActualDate = ms.ActualDate,
                VarianceDays = ms.VarianceDays,
                CreatedAt = ms.CreatedAt
            });

        return new CreateMilestoneCommandHandler(
            applicationRepoMock.Object,
            milestoneRepoMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object);
    }

    #endregion
}
