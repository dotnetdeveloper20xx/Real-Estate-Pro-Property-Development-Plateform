using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.TransitionApplicationStatus;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using BuildEstate.Infrastructure.Persistence.Services;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for conditional transition data requirements.
/// Validates that the TransitionApplicationStatusCommandHandler correctly enforces:
/// - ApplicationReference 5-50 chars for Submitted transition
/// - DecisionDate not in the future for Approved/ApprovedWithConditions/Refused transitions
/// - WithdrawalReason 10+ chars for Withdrawn transition
///
/// **Validates: Requirements 2.4, 2.5, 2.6**
/// </summary>
public class ConditionalTransitionDataPropertyTests
{
    private readonly IPlanningStatusStateMachine _stateMachine = new PlanningStatusStateMachine();

    #region Property 8: Conditional Transition Data Requirements — ApplicationReference

    /// <summary>
    /// Property 8: For any status transition to Submitted, it SHALL succeed only when the provided
    /// ApplicationReference has length between 5 and 50 characters.
    /// References with valid length (5-50) should allow the transition to succeed.
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TransitionToSubmitted_WithValidApplicationReferenceLength_Succeeds()
    {
        var lengthGen = Gen.Choose(5, 50);

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var applicationReference = new string('R', length);
                var handler = CreateHandler(PlanningApplicationStatus.PreApplication);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Submitted,
                    ApplicationReference = applicationReference
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should succeed (no BusinessRuleViolationException)
                act.Should().NotThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): For any status transition to Submitted, it SHALL be rejected
    /// when the provided ApplicationReference has length below 5 characters.
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TransitionToSubmitted_WithTooShortApplicationReference_Fails()
    {
        // Generate lengths from 1 to 4 (too short)
        var lengthGen = Gen.Choose(1, 4);

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var applicationReference = new string('R', length);
                var handler = CreateHandler(PlanningApplicationStatus.PreApplication);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Submitted,
                    ApplicationReference = applicationReference
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should fail with BusinessRuleViolationException
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("ApplicationReferenceLength");

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): For any status transition to Submitted, it SHALL be rejected
    /// when the provided ApplicationReference has length above 50 characters.
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TransitionToSubmitted_WithTooLongApplicationReference_Fails()
    {
        // Generate lengths from 51 to 200 (too long)
        var lengthGen = Gen.Choose(51, 200);

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var applicationReference = new string('R', length);
                var handler = CreateHandler(PlanningApplicationStatus.PreApplication);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Submitted,
                    ApplicationReference = applicationReference
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should fail with BusinessRuleViolationException
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("ApplicationReferenceLength");

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): For any status transition to Submitted with empty/null
    /// ApplicationReference, it SHALL always be rejected.
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 20)]
    public Property TransitionToSubmitted_WithMissingApplicationReference_Fails()
    {
        var nullOrEmptyGen = Gen.Elements<string?>(null, "", "   ", "  ");

        return Prop.ForAll(
            nullOrEmptyGen.ToArbitrary(),
            applicationReference =>
            {
                // Arrange
                var handler = CreateHandler(PlanningApplicationStatus.PreApplication);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Submitted,
                    ApplicationReference = applicationReference
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should fail with BusinessRuleViolationException
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("ApplicationReferenceRequired");

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): Boundary test — ApplicationReference accepted if and only if
    /// trimmed length is between 5 and 50 (inclusive). Uses random lengths across the full
    /// boundary spectrum.
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property TransitionToSubmitted_ApplicationReferenceBoundary_EnforcesFiveToFiftyChars()
    {
        var lengthGen = Gen.Frequency(
            Tuple.Create(3, Gen.Choose(1, 4)),     // below minimum
            Tuple.Create(4, Gen.Choose(5, 50)),    // within valid range
            Tuple.Create(3, Gen.Choose(51, 150))   // above maximum
        );

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var applicationReference = new string('X', length);
                var handler = CreateHandler(PlanningApplicationStatus.PreApplication);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Submitted,
                    ApplicationReference = applicationReference
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                var isValidLength = length >= 5 && length <= 50;

                if (isValidLength)
                {
                    act.Should().NotThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();
                }
                else
                {
                    act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();
                }

                return true;
            });
    }

    #endregion

    #region Property 8: Conditional Transition Data Requirements — DecisionDate

    /// <summary>
    /// Property 8 (continued): For any transition to Approved, ApprovedWithConditions, or Refused,
    /// it SHALL succeed only when a DecisionDate is provided that is not in the future.
    /// Past/present dates should allow the transition.
    ///
    /// **Validates: Requirements 2.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TransitionToDecisionStatuses_WithPastOrPresentDecisionDate_Succeeds()
    {
        // Statuses that require a decision date
        var decisionStatuses = new[]
        {
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions,
            PlanningApplicationStatus.Refused
        };

        // Generate days in the past (0 = today, up to 3650 days back = ~10 years)
        var daysAgoGen = Gen.Choose(0, 3650);
        var statusGen = Gen.Elements(decisionStatuses);

        return Prop.ForAll(
            daysAgoGen.ToArbitrary(),
            statusGen.ToArbitrary(),
            (daysAgo, targetStatus) =>
            {
                // Arrange — use a source status that can reach the target
                var sourceStatus = GetValidSourceForTarget(targetStatus);
                var decisionDate = DateTime.UtcNow.Date.AddDays(-daysAgo);
                var handler = CreateHandler(sourceStatus);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = targetStatus,
                    DecisionDate = decisionDate
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should succeed (no BusinessRuleViolationException for date)
                act.Should().NotThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): For any transition to Approved, ApprovedWithConditions, or Refused,
    /// it SHALL be rejected when the DecisionDate is in the future.
    ///
    /// **Validates: Requirements 2.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TransitionToDecisionStatuses_WithFutureDecisionDate_Fails()
    {
        var decisionStatuses = new[]
        {
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions,
            PlanningApplicationStatus.Refused
        };

        // Generate days in the future (1 to 3650 days ahead)
        var daysAheadGen = Gen.Choose(1, 3650);
        var statusGen = Gen.Elements(decisionStatuses);

        return Prop.ForAll(
            daysAheadGen.ToArbitrary(),
            statusGen.ToArbitrary(),
            (daysAhead, targetStatus) =>
            {
                // Arrange
                var sourceStatus = GetValidSourceForTarget(targetStatus);
                var futureDate = DateTime.UtcNow.Date.AddDays(daysAhead);
                var handler = CreateHandler(sourceStatus);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = targetStatus,
                    DecisionDate = futureDate
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should fail with BusinessRuleViolationException
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("DecisionDateNotFuture");

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): For any transition to Approved, ApprovedWithConditions, or Refused,
    /// it SHALL be rejected when no DecisionDate is provided (null).
    ///
    /// **Validates: Requirements 2.5**
    /// </summary>
    [Property(MaxTest = 30)]
    public Property TransitionToDecisionStatuses_WithMissingDecisionDate_Fails()
    {
        var decisionStatuses = new[]
        {
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions,
            PlanningApplicationStatus.Refused
        };

        var statusGen = Gen.Elements(decisionStatuses);

        return Prop.ForAll(
            statusGen.ToArbitrary(),
            targetStatus =>
            {
                // Arrange
                var sourceStatus = GetValidSourceForTarget(targetStatus);
                var handler = CreateHandler(sourceStatus);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = targetStatus,
                    DecisionDate = null
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("DecisionDateRequired");

                return true;
            });
    }

    #endregion

    #region Property 8: Conditional Transition Data Requirements — WithdrawalReason

    /// <summary>
    /// Property 8 (continued): For any transition to Withdrawn, it SHALL succeed only when
    /// a WithdrawalReason of at least 10 characters is provided.
    ///
    /// **Validates: Requirements 2.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TransitionToWithdrawn_WithValidWithdrawalReasonLength_Succeeds()
    {
        // Generate lengths >= 10 (valid)
        var lengthGen = Gen.Choose(10, 500);

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange — Submitted can transition to Withdrawn
                var withdrawalReason = new string('W', length);
                var handler = CreateHandler(PlanningApplicationStatus.Submitted);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Withdrawn,
                    WithdrawalReason = withdrawalReason
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should succeed
                act.Should().NotThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): For any transition to Withdrawn, it SHALL be rejected
    /// when the WithdrawalReason has fewer than 10 characters.
    ///
    /// **Validates: Requirements 2.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TransitionToWithdrawn_WithTooShortWithdrawalReason_Fails()
    {
        // Generate lengths 1-9 (too short)
        var lengthGen = Gen.Choose(1, 9);

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var withdrawalReason = new string('W', length);
                var handler = CreateHandler(PlanningApplicationStatus.Submitted);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Withdrawn,
                    WithdrawalReason = withdrawalReason
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should fail
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("WithdrawalReasonLength");

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): For any transition to Withdrawn with empty/null
    /// WithdrawalReason, it SHALL always be rejected.
    ///
    /// **Validates: Requirements 2.6**
    /// </summary>
    [Property(MaxTest = 20)]
    public Property TransitionToWithdrawn_WithMissingWithdrawalReason_Fails()
    {
        var nullOrEmptyGen = Gen.Elements<string?>(null, "", "   ", "  ");

        return Prop.ForAll(
            nullOrEmptyGen.ToArbitrary(),
            withdrawalReason =>
            {
                // Arrange
                var handler = CreateHandler(PlanningApplicationStatus.Submitted);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Withdrawn,
                    WithdrawalReason = withdrawalReason
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("WithdrawalReasonRequired");

                return true;
            });
    }

    /// <summary>
    /// Property 8 (continued): Boundary test — WithdrawalReason accepted if and only if
    /// trimmed length is at least 10 characters. Uses random lengths across the boundary.
    ///
    /// **Validates: Requirements 2.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property TransitionToWithdrawn_WithdrawalReasonBoundary_EnforcesMinimumTenChars()
    {
        var lengthGen = Gen.Frequency(
            Tuple.Create(4, Gen.Choose(1, 9)),     // below minimum
            Tuple.Create(6, Gen.Choose(10, 500))   // at or above minimum
        );

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var withdrawalReason = new string('W', length);
                var handler = CreateHandler(PlanningApplicationStatus.Submitted);

                var command = new TransitionApplicationStatusCommand
                {
                    ApplicationId = Guid.NewGuid(),
                    NewStatus = PlanningApplicationStatus.Withdrawn,
                    WithdrawalReason = withdrawalReason
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                var isValidLength = length >= 10;

                if (isValidLength)
                {
                    act.Should().NotThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();
                }
                else
                {
                    act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();
                }

                return true;
            });
    }

    #endregion

    #region Test Helpers

    /// <summary>
    /// Gets a valid source status that can transition to the specified target status.
    /// </summary>
    private static PlanningApplicationStatus GetValidSourceForTarget(PlanningApplicationStatus targetStatus)
    {
        return targetStatus switch
        {
            PlanningApplicationStatus.Submitted => PlanningApplicationStatus.PreApplication,
            PlanningApplicationStatus.Approved => PlanningApplicationStatus.UnderReview,
            PlanningApplicationStatus.ApprovedWithConditions => PlanningApplicationStatus.UnderReview,
            PlanningApplicationStatus.Refused => PlanningApplicationStatus.UnderReview,
            PlanningApplicationStatus.Withdrawn => PlanningApplicationStatus.Submitted,
            _ => PlanningApplicationStatus.PreApplication
        };
    }

    /// <summary>
    /// Creates a TransitionApplicationStatusCommandHandler with the application in the given source status.
    /// The handler uses the real PlanningStatusStateMachine and mocked repositories.
    /// </summary>
    private TransitionApplicationStatusCommandHandler CreateHandler(PlanningApplicationStatus sourceStatus)
    {
        var applicationId = Guid.NewGuid();
        var application = new PlanningApplication
        {
            Id = applicationId,
            OpportunityId = Guid.NewGuid(),
            Description = "Test application for property testing",
            ApplicationType = PlanningApplicationType.Full,
            Status = sourceStatus,
            CouncilName = "Test Council",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            CreatedBy = "test-user"
        };

        var applicationRepoMock = new Mock<IRepository<PlanningApplication>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();
        var loggerMock = new Mock<ILogger<TransitionApplicationStatusCommandHandler>>();

        // Setup repository to return the application for any ID
        applicationRepoMock
            .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(application);

        applicationRepoMock
            .Setup(r => r.Update(It.IsAny<PlanningApplication>()));

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<ApplicationDto>(It.IsAny<PlanningApplication>()))
            .Returns((PlanningApplication app) => new ApplicationDto
            {
                Id = app.Id,
                OpportunityId = app.OpportunityId,
                Description = app.Description,
                ApplicationType = app.ApplicationType.ToString(),
                Status = app.Status.ToString(),
                ApplicationReference = app.ApplicationReference,
                CouncilName = app.CouncilName,
                SubmissionDate = app.SubmissionDate,
                TargetDecisionDate = app.TargetDecisionDate,
                CreatedAt = app.CreatedAt,
                CreatedBy = app.CreatedBy
            });

        return new TransitionApplicationStatusCommandHandler(
            applicationRepoMock.Object,
            _stateMachine,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object,
            loggerMock.Object);
    }

    #endregion
}
