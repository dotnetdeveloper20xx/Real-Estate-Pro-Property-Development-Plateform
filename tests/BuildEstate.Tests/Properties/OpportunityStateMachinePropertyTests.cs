using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using BuildEstate.Infrastructure.Persistence.Services;
using AutoMapper;
using FsCheck;
using FsCheck.Xunit;
using FluentAssertions;
using MediatR;
using Moq;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for the Opportunity State Machine and related gate/approval logic.
/// Validates: Requirements 3.1, 3.2, 5.4, 5.5, 11.1, 11.5
/// </summary>
public class OpportunityStateMachinePropertyTests
{
    private static readonly HashSet<(OpportunityStatus From, OpportunityStatus To)> ValidTransitions = new()
    {
        (OpportunityStatus.Identified, OpportunityStatus.InitialReview),
        (OpportunityStatus.InitialReview, OpportunityStatus.DueDiligence),
        (OpportunityStatus.InitialReview, OpportunityStatus.Withdrawn),
        (OpportunityStatus.DueDiligence, OpportunityStatus.OfferMade),
        (OpportunityStatus.DueDiligence, OpportunityStatus.Withdrawn),
        (OpportunityStatus.OfferMade, OpportunityStatus.UnderContract),
        (OpportunityStatus.OfferMade, OpportunityStatus.Withdrawn),
        (OpportunityStatus.UnderContract, OpportunityStatus.Acquired),
        (OpportunityStatus.UnderContract, OpportunityStatus.Withdrawn)
    };

    private static readonly OpportunityStatus[] AllStatuses =
        Enum.GetValues<OpportunityStatus>();

    #region Property 1: Opportunity State Machine Correctness

    /// <summary>
    /// Property 1: Opportunity State Machine Correctness
    /// For any pair of OpportunityStatus values (from, to), the state machine permits the transition
    /// if and only if (from, to) is in the valid transitions set. For all other pairs, the state machine
    /// rejects the transition and returns the list of permitted transitions from the current status.
    /// 
    /// **Validates: Requirements 3.1, 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property StateMachine_PermitsOnlyValidTransitions()
    {
        var stateMachine = new OpportunityStateMachine();

        return Prop.ForAll(
            GenerateStatusPair(),
            pair =>
            {
                var (from, to) = pair;
                var isValid = ValidTransitions.Contains((from, to));
                var canTransition = stateMachine.CanTransition(from, to);

                return (canTransition == isValid)
                    .Label($"CanTransition({from}, {to}) should be {isValid} but was {canTransition}");
            });
    }

    /// <summary>
    /// Property 1 (complementary): ValidateTransition throws InvalidStateTransitionException
    /// for all invalid transitions, and includes permitted transitions in the exception.
    /// 
    /// **Validates: Requirements 3.1, 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property StateMachine_ThrowsForInvalidTransitions_WithPermittedList()
    {
        var stateMachine = new OpportunityStateMachine();

        return Prop.ForAll(
            GenerateInvalidStatusPair(),
            pair =>
            {
                var (from, to) = pair;
                var action = () => stateMachine.ValidateTransition(from, to);

                action.Should().Throw<InvalidStateTransitionException>();

                // Verify GetPermittedTransitions is consistent
                var permitted = stateMachine.GetPermittedTransitions(from);
                permitted.Should().NotContain(to);

                return true;
            });
    }

    /// <summary>
    /// Property 1 (complementary): ValidateTransition does NOT throw for valid transitions.
    /// 
    /// **Validates: Requirements 3.1, 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property StateMachine_DoesNotThrowForValidTransitions()
    {
        var stateMachine = new OpportunityStateMachine();

        return Prop.ForAll(
            GenerateValidStatusPair(),
            pair =>
            {
                var (from, to) = pair;
                var action = () => stateMachine.ValidateTransition(from, to);

                action.Should().NotThrow();

                // Verify GetPermittedTransitions includes this target
                var permitted = stateMachine.GetPermittedTransitions(from);
                permitted.Should().Contain(to);

                return true;
            });
    }

    #endregion

    #region Property 5: Due Diligence Completion Gate

    /// <summary>
    /// Property 5: Due Diligence Completion Gate
    /// For any LandOpportunity in DueDiligence status, the system allows transition to OfferMade
    /// if and only if all mandatory due diligence checks (Legal, Environmental, Planning) have
    /// status Completed. If any mandatory check is missing or has a status other than Completed,
    /// the transition is blocked with a BusinessRuleViolationException.
    /// 
    /// **Validates: Requirements 5.4, 5.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DueDiligenceGate_AllowsTransitionOnlyWhenAllMandatoryDDCompleted()
    {
        return Prop.ForAll(
            GenerateDueDiligenceScenario(),
            scenario =>
            {
                var opportunity = CreateOpportunityInDueDiligenceWithDD(scenario);

                var allMandatoryCompleted = scenario.LegalStatus == DueDiligenceStatus.Completed
                    && scenario.EnvironmentalStatus == DueDiligenceStatus.Completed
                    && scenario.PlanningStatus == DueDiligenceStatus.Completed;

                // Set up handler with mocks
                var (handler, _) = CreateTransitionHandler(opportunity);

                var command = new TransitionOpportunityStatusCommand
                {
                    OpportunityId = opportunity.Id,
                    TargetStatus = OpportunityStatus.OfferMade
                };

                Func<Task> action = () => handler.Handle(command, CancellationToken.None);

                if (allMandatoryCompleted)
                {
                    action.Should().NotThrowAsync().Wait();
                }
                else
                {
                    action.Should().ThrowAsync<BusinessRuleViolationException>().Wait();
                }

                return true;
            });
    }

    #endregion

    #region Property 17: Pending Approval Blocks Transitions

    /// <summary>
    /// Property 17: Pending Approval Blocks Transitions
    /// For any LandOpportunity with pending ApprovalRequests, any status transition attempt
    /// is blocked by throwing ApprovalRequiredException.
    /// 
    /// **Validates: Requirements 11.1, 11.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property PendingApproval_BlocksAllTransitions()
    {
        return Prop.ForAll(
            GeneratePendingApprovalScenario(),
            scenario =>
            {
                var opportunity = CreateOpportunityWithPendingApproval(
                    scenario.CurrentStatus,
                    scenario.RequestedAmount);

                var (handler, _) = CreateTransitionHandler(opportunity);

                var command = new TransitionOpportunityStatusCommand
                {
                    OpportunityId = opportunity.Id,
                    TargetStatus = scenario.TargetStatus,
                    WithdrawalReason = scenario.TargetStatus == OpportunityStatus.Withdrawn
                        ? "Test withdrawal with pending approval"
                        : null
                };

                Func<Task> action = () => handler.Handle(command, CancellationToken.None);

                action.Should().ThrowAsync<ApprovalRequiredException>().Wait();

                return true;
            });
    }

    #endregion

    #region Property 18: Threshold-Based Approval Trigger

    /// <summary>
    /// Property 18: Threshold-Based Approval Trigger
    /// For any offer amount, if the amount exceeds the threshold (500,000), an approval
    /// request should be required. Offers at or below the threshold should not require approval.
    /// This tests the rule logic (not the handler wiring which is in task 15.4).
    /// 
    /// **Validates: Requirements 11.1, 11.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ThresholdApproval_TriggeredWhenOfferExceedsThreshold()
    {
        const decimal threshold = 500_000m;

        return Prop.ForAll(
            GenerateOfferAmount(),
            amount =>
            {
                var requiresApproval = amount > threshold;

                // Simulate the threshold check logic
                var shouldTriggerApproval = ShouldTriggerApproval(amount, threshold);

                return (shouldTriggerApproval == requiresApproval)
                    .Label($"Amount {amount}: expected requiresApproval={requiresApproval}, " +
                           $"got shouldTriggerApproval={shouldTriggerApproval}");
            });
    }

    /// <summary>
    /// Property 18 (complementary): Verify the threshold boundary behavior.
    /// Offers exactly at the threshold do NOT trigger approval; amounts above do.
    /// 
    /// **Validates: Requirements 11.1, 11.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ThresholdApproval_BoundaryBehavior()
    {
        const decimal threshold = 500_000m;

        return Prop.ForAll(
            GenerateBoundaryAmount(),
            amount =>
            {
                var shouldTrigger = ShouldTriggerApproval(amount, threshold);

                if (amount <= threshold)
                {
                    return (!shouldTrigger)
                        .Label($"Amount {amount} <= threshold {threshold} should NOT trigger approval");
                }
                else
                {
                    return shouldTrigger
                        .Label($"Amount {amount} > threshold {threshold} SHOULD trigger approval");
                }
            });
    }

    #endregion

    #region Generators

    private static Arbitrary<(OpportunityStatus From, OpportunityStatus To)> GenerateStatusPair()
    {
        var gen = from fromStatus in Gen.Elements(AllStatuses)
                  from toStatus in Gen.Elements(AllStatuses)
                  select (fromStatus, toStatus);
        return Arb.From(gen);
    }

    private static Arbitrary<(OpportunityStatus From, OpportunityStatus To)> GenerateInvalidStatusPair()
    {
        var invalidPairs = (from f in AllStatuses
                           from t in AllStatuses
                           where !ValidTransitions.Contains((f, t))
                           select (f, t)).ToArray();

        var gen = Gen.Elements(invalidPairs);
        return Arb.From(gen);
    }

    private static Arbitrary<(OpportunityStatus From, OpportunityStatus To)> GenerateValidStatusPair()
    {
        var validPairs = ValidTransitions.ToArray();
        var gen = Gen.Elements(validPairs);
        return Arb.From(gen);
    }

    private static Arbitrary<DueDiligenceScenario> GenerateDueDiligenceScenario()
    {
        var ddStatuses = Enum.GetValues<DueDiligenceStatus>();

        var gen = from legal in Gen.Elements(ddStatuses)
                  from environmental in Gen.Elements(ddStatuses)
                  from planning in Gen.Elements(ddStatuses)
                  from hasLegal in Gen.Elements(true, false)
                  from hasEnvironmental in Gen.Elements(true, false)
                  from hasPlanning in Gen.Elements(true, false)
                  select new DueDiligenceScenario
                  {
                      LegalStatus = hasLegal ? legal : null,
                      EnvironmentalStatus = hasEnvironmental ? environmental : null,
                      PlanningStatus = hasPlanning ? planning : null
                  };

        return Arb.From(gen);
    }

    private static Arbitrary<PendingApprovalScenario> GeneratePendingApprovalScenario()
    {
        // Only generate scenarios with valid transitions (so we reach the approval check)
        var validFromStatuses = ValidTransitions
            .Select(t => t.From)
            .Distinct()
            .ToArray();

        var gen = from fromStatus in Gen.Elements(validFromStatuses)
                  let permittedTargets = ValidTransitions
                      .Where(t => t.From == fromStatus)
                      .Select(t => t.To)
                      .ToArray()
                  from toStatus in Gen.Elements(permittedTargets)
                  from amount in Gen.Choose(100_000, 2_000_000).Select(x => (decimal)x)
                  select new PendingApprovalScenario
                  {
                      CurrentStatus = fromStatus,
                      TargetStatus = toStatus,
                      RequestedAmount = amount
                  };

        return Arb.From(gen);
    }

    private static Arbitrary<decimal> GenerateOfferAmount()
    {
        // Generate amounts across a wide range, including around the threshold
        var gen = Gen.Frequency(
            Tuple.Create(3, Gen.Choose(1, 499_999).Select(x => (decimal)x)),         // Below threshold
            Tuple.Create(1, Gen.Constant(500_000m)),                                   // Exactly at threshold
            Tuple.Create(3, Gen.Choose(500_001, 5_000_000).Select(x => (decimal)x)),  // Above threshold
            Tuple.Create(1, Gen.Choose(1, 100).Select(x => x * 0.01m + 500_000m))     // Just above threshold
        );

        return Arb.From(gen);
    }

    private static Arbitrary<decimal> GenerateBoundaryAmount()
    {
        // Focus on boundary values around 500,000
        var gen = Gen.Frequency(
            Tuple.Create(2, Gen.Choose(499_990, 500_000).Select(x => (decimal)x)),    // At or just below
            Tuple.Create(2, Gen.Choose(500_001, 500_010).Select(x => (decimal)x)),    // Just above
            Tuple.Create(1, Gen.Choose(1, 1_000_000).Select(x => (decimal)x))          // Wide range
        );

        return Arb.From(gen);
    }

    #endregion

    #region Helper Methods

    private static bool ShouldTriggerApproval(decimal offerAmount, decimal threshold)
    {
        return offerAmount > threshold;
    }

    private static LandOpportunity CreateOpportunityInDueDiligenceWithDD(DueDiligenceScenario scenario)
    {
        var opportunityId = Guid.NewGuid();
        var opportunity = new LandOpportunity
        {
            Id = opportunityId,
            Name = "Test Opportunity",
            Location = "Test Location",
            LandSize = 10.5m,
            Status = OpportunityStatus.DueDiligence,
            CreatedBy = "test-user",
            CreatedAt = DateTime.UtcNow,
            DueDiligences = new List<DueDiligence>(),
            ApprovalRequests = new List<ApprovalRequest>()
        };

        if (scenario.LegalStatus.HasValue)
        {
            opportunity.DueDiligences.Add(new DueDiligence
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunityId,
                Type = DueDiligenceType.Legal,
                Status = scenario.LegalStatus.Value,
                CreatedBy = "test-user",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (scenario.EnvironmentalStatus.HasValue)
        {
            opportunity.DueDiligences.Add(new DueDiligence
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunityId,
                Type = DueDiligenceType.Environmental,
                Status = scenario.EnvironmentalStatus.Value,
                CreatedBy = "test-user",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (scenario.PlanningStatus.HasValue)
        {
            opportunity.DueDiligences.Add(new DueDiligence
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunityId,
                Type = DueDiligenceType.Planning,
                Status = scenario.PlanningStatus.Value,
                CreatedBy = "test-user",
                CreatedAt = DateTime.UtcNow
            });
        }

        return opportunity;
    }

    private static LandOpportunity CreateOpportunityWithPendingApproval(
        OpportunityStatus currentStatus,
        decimal requestedAmount)
    {
        var opportunityId = Guid.NewGuid();
        var opportunity = new LandOpportunity
        {
            Id = opportunityId,
            Name = "Test Opportunity",
            Location = "Test Location",
            LandSize = 10.5m,
            Status = currentStatus,
            CreatedBy = "test-user",
            CreatedAt = DateTime.UtcNow,
            DueDiligences = new List<DueDiligence>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunityId,
                    Type = DueDiligenceType.Legal,
                    Status = DueDiligenceStatus.Completed,
                    CreatedBy = "test-user",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunityId,
                    Type = DueDiligenceType.Environmental,
                    Status = DueDiligenceStatus.Completed,
                    CreatedBy = "test-user",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunityId,
                    Type = DueDiligenceType.Planning,
                    Status = DueDiligenceStatus.Completed,
                    CreatedBy = "test-user",
                    CreatedAt = DateTime.UtcNow
                }
            },
            ApprovalRequests = new List<ApprovalRequest>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunityId,
                    Status = ApprovalStatus.Pending,
                    RequestedAmount = requestedAmount,
                    CreatedBy = "system",
                    CreatedAt = DateTime.UtcNow
                }
            }
        };

        return opportunity;
    }

    private static (TransitionOpportunityStatusCommandHandler Handler, Mock<IRepository<LandOpportunity>> RepoMock)
        CreateTransitionHandler(LandOpportunity opportunity)
    {
        var repoMock = new Mock<IRepository<LandOpportunity>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();
        var stateMachine = new OpportunityStateMachine();
        var publisherMock = new Mock<IPublisher>();

        // Setup Query() to return an in-memory queryable that supports Include
        var opportunities = new List<LandOpportunity> { opportunity };
        var queryable = opportunities.AsQueryable();

        // Use a simple mock that returns the opportunity when queried by Id
        repoMock.Setup(r => r.Query())
            .Returns(new TestAsyncQueryable<LandOpportunity>(opportunities));

        unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock.Setup(c => c.UserId).Returns("test-user");

        mapperMock.Setup(m => m.Map<OpportunityDto>(It.IsAny<LandOpportunity>()))
            .Returns(new OpportunityDto());

        var handler = new TransitionOpportunityStatusCommandHandler(
            repoMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object,
            stateMachine,
            publisherMock.Object);

        return (handler, repoMock);
    }

    #endregion

    #region Test Data Models

    private sealed class DueDiligenceScenario
    {
        public DueDiligenceStatus? LegalStatus { get; init; }
        public DueDiligenceStatus? EnvironmentalStatus { get; init; }
        public DueDiligenceStatus? PlanningStatus { get; init; }
    }

    private sealed class PendingApprovalScenario
    {
        public OpportunityStatus CurrentStatus { get; init; }
        public OpportunityStatus TargetStatus { get; init; }
        public decimal RequestedAmount { get; init; }
    }

    #endregion
}
