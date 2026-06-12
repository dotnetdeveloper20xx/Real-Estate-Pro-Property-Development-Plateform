using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.CreateCondition;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for condition creation validating that conditions can only be created
/// against applications with Status = ApprovedWithConditions and that successful creation
/// always produces a condition with Status = Outstanding.
///
/// **Validates: Requirements 5.1, 5.2**
/// </summary>
public class ConditionCreationPropertyTests
{
    /// <summary>
    /// Property 9: Condition Creation Requires ApprovedWithConditions Parent
    ///
    /// For any PlanningApplication with a Status OTHER THAN ApprovedWithConditions,
    /// attempting to create a PlanningCondition for that application SHALL always be rejected
    /// with a BusinessRuleViolationException.
    ///
    /// **Validates: Requirements 5.1, 5.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ConditionCreation_WithNonApprovedWithConditionsStatus_AlwaysFails()
    {
        var nonApprovedStatuses = Enum.GetValues<PlanningApplicationStatus>()
            .Where(s => s != PlanningApplicationStatus.ApprovedWithConditions)
            .ToArray();

        return Prop.ForAll(
            Gen.Elements(nonApprovedStatuses).ToArbitrary(),
            status =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, status);
                var handler = CreateHandler(application);

                var command = new CreateConditionCommand
                {
                    ApplicationId = applicationId,
                    ConditionNumber = 1,
                    Description = "A valid description for this planning condition",
                    ConditionType = ConditionType.PreCommencement
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("ConditionRequiresApprovedWithConditions");

                return true;
            });
    }

    /// <summary>
    /// Property 9 (continued): When the parent application has Status = ApprovedWithConditions,
    /// condition creation SHALL succeed with valid data and the created condition SHALL always
    /// have Status = Outstanding.
    ///
    /// **Validates: Requirements 5.1, 5.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ConditionCreation_WithApprovedWithConditionsStatus_SucceedsAndProducesOutstandingStatus()
    {
        var conditionTypeGen = Gen.Elements(Enum.GetValues<ConditionType>());
        var conditionNumberGen = Gen.Choose(1, 100);

        return Prop.ForAll(
            conditionTypeGen.ToArbitrary(),
            conditionNumberGen.ToArbitrary(),
            (conditionType, conditionNumber) =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, PlanningApplicationStatus.ApprovedWithConditions);

                PlanningCondition? capturedCondition = null;
                var handler = CreateHandler(application, onAdd: c => capturedCondition = c);

                var command = new CreateConditionCommand
                {
                    ApplicationId = applicationId,
                    ConditionNumber = conditionNumber,
                    Description = "A valid description for this planning condition",
                    ConditionType = conditionType
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert — created condition must have Status = Outstanding
                capturedCondition.Should().NotBeNull();
                capturedCondition!.Status.Should().Be(ConditionStatus.Outstanding,
                    "newly created conditions must always have Status = Outstanding");
                capturedCondition.ApplicationId.Should().Be(applicationId);
                capturedCondition.ConditionNumber.Should().Be(conditionNumber);
                capturedCondition.ConditionType.Should().Be(conditionType);

                return true;
            });
    }

    /// <summary>
    /// Property 9 (continued): Exhaustive verification that ONLY ApprovedWithConditions allows creation.
    /// For ALL PlanningApplicationStatus values, creation succeeds if and only if
    /// status == ApprovedWithConditions.
    ///
    /// **Validates: Requirements 5.1, 5.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ConditionCreation_OnlyApprovedWithConditions_AllowsCreation()
    {
        var allStatuses = Enum.GetValues<PlanningApplicationStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            status =>
            {
                // Arrange
                var applicationId = Guid.NewGuid();
                var application = CreateApplication(applicationId, status);
                var handler = CreateHandler(application);

                var command = new CreateConditionCommand
                {
                    ApplicationId = applicationId,
                    ConditionNumber = 1,
                    Description = "A valid description for this planning condition",
                    ConditionType = ConditionType.Compliance
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                if (status == PlanningApplicationStatus.ApprovedWithConditions)
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

    private static CreateConditionCommandHandler CreateHandler(
        PlanningApplication application,
        Action<PlanningCondition>? onAdd = null)
    {
        var applicationRepoMock = new Mock<IRepository<PlanningApplication>>();
        var conditionRepoMock = new Mock<IRepository<PlanningCondition>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();

        // Setup application repository to return the test application
        applicationRepoMock
            .Setup(r => r.GetByIdAsync(application.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(application);

        // Setup condition repository Query() to return empty (no duplicate conditions exist)
        var emptyConditions = new List<PlanningCondition>();
        conditionRepoMock
            .Setup(r => r.Query())
            .Returns(new TestAsyncQueryable<PlanningCondition>(emptyConditions));

        // Capture added condition for assertion
        conditionRepoMock
            .Setup(r => r.AddAsync(It.IsAny<PlanningCondition>(), It.IsAny<CancellationToken>()))
            .Callback<PlanningCondition, CancellationToken>((condition, _) => onAdd?.Invoke(condition))
            .Returns(Task.CompletedTask);

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<ConditionDto>(It.IsAny<PlanningCondition>()))
            .Returns((PlanningCondition c) => new ConditionDto
            {
                Id = c.Id,
                ApplicationId = c.ApplicationId,
                ConditionNumber = c.ConditionNumber,
                Description = c.Description,
                ConditionType = c.ConditionType.ToString(),
                Status = c.Status.ToString(),
                CreatedAt = c.CreatedAt
            });

        return new CreateConditionCommandHandler(
            applicationRepoMock.Object,
            conditionRepoMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object);
    }

    #endregion
}
