using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.TransitionFeeStatus;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Application.Settings;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using BuildEstate.Infrastructure.Persistence.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for fee threshold enforcement validating that fees with Amount
/// exceeding the configured threshold cannot transition directly from Pending to Paid,
/// and must go through AwaitingApproval → Approved → Paid. Fees at or below the threshold
/// are permitted to go directly from Pending to Paid.
///
/// **Validates: Requirements 8.3**
/// </summary>
public class FeeThresholdPropertyTests
{
    private const decimal DefaultThreshold = 10000m;

    /// <summary>
    /// Property 14: Fee Threshold Enforcement — Above Threshold, Pending → Paid is Rejected
    ///
    /// For any PlanningFee where Amount exceeds the configured threshold, attempting to
    /// transition from Pending to Paid SHALL be rejected with a BusinessRuleViolationException.
    ///
    /// **Validates: Requirements 8.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AboveThreshold_PendingToPaid_AlwaysRejected()
    {
        // Generate amounts strictly above the threshold (threshold + 0.01 to threshold + 1,000,000)
        var aboveThresholdGen = Gen.Choose(1, 100000000)
            .Select(cents => DefaultThreshold + (cents / 100m));

        return Prop.ForAll(
            aboveThresholdGen.ToArbitrary(),
            amount =>
            {
                // Arrange
                var fee = CreateFee(amount, PaymentStatus.Pending);
                var handler = CreateHandler(fee);

                var command = new TransitionFeeStatusCommand
                {
                    FeeId = fee.Id,
                    NewStatus = PaymentStatus.Paid
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                var exception = act.Should().ThrowAsync<BusinessRuleViolationException>()
                    .GetAwaiter().GetResult();

                exception.Which.RuleName.Should().Be("FeeThresholdApprovalRequired");

                return true;
            });
    }

    /// <summary>
    /// Property 14: Fee Threshold Enforcement — At or Below Threshold, Pending → Paid is Accepted
    ///
    /// For any PlanningFee where Amount is at or below the configured threshold, direct
    /// transition from Pending to Paid SHALL be permitted.
    ///
    /// **Validates: Requirements 8.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AtOrBelowThreshold_PendingToPaid_AlwaysAccepted()
    {
        // Generate amounts from 0.01 up to and including the threshold
        var atOrBelowThresholdGen = Gen.Choose(1, (int)(DefaultThreshold * 100))
            .Select(cents => cents / 100m);

        return Prop.ForAll(
            atOrBelowThresholdGen.ToArbitrary(),
            amount =>
            {
                // Arrange
                var fee = CreateFee(amount, PaymentStatus.Pending);
                PlanningFee? updatedFee = null;
                var handler = CreateHandler(fee, onUpdate: f => updatedFee = f);

                var command = new TransitionFeeStatusCommand
                {
                    FeeId = fee.Id,
                    NewStatus = PaymentStatus.Paid
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                updatedFee.Should().NotBeNull();
                updatedFee!.PaymentStatus.Should().Be(PaymentStatus.Paid);

                return true;
            });
    }

    /// <summary>
    /// Property 14: Fee Threshold Enforcement — Above Threshold, AwaitingApproval → Approved is Accepted
    ///
    /// For any PlanningFee where Amount exceeds the threshold, transitioning from
    /// AwaitingApproval to Approved SHALL be permitted (valid path for high-value fees).
    ///
    /// **Validates: Requirements 8.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AboveThreshold_AwaitingApprovalToApproved_AlwaysAccepted()
    {
        var aboveThresholdGen = Gen.Choose(1, 100000000)
            .Select(cents => DefaultThreshold + (cents / 100m));

        return Prop.ForAll(
            aboveThresholdGen.ToArbitrary(),
            amount =>
            {
                // Arrange
                var fee = CreateFee(amount, PaymentStatus.AwaitingApproval);
                PlanningFee? updatedFee = null;
                var handler = CreateHandler(fee, onUpdate: f => updatedFee = f);

                var command = new TransitionFeeStatusCommand
                {
                    FeeId = fee.Id,
                    NewStatus = PaymentStatus.Approved
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                updatedFee.Should().NotBeNull();
                updatedFee!.PaymentStatus.Should().Be(PaymentStatus.Approved);

                return true;
            });
    }

    /// <summary>
    /// Property 14: Fee Threshold Enforcement — Above Threshold, Approved → Paid is Accepted
    ///
    /// For any PlanningFee where Amount exceeds the threshold, transitioning from
    /// Approved to Paid SHALL be permitted (valid final step for high-value fees).
    ///
    /// **Validates: Requirements 8.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AboveThreshold_ApprovedToPaid_AlwaysAccepted()
    {
        var aboveThresholdGen = Gen.Choose(1, 100000000)
            .Select(cents => DefaultThreshold + (cents / 100m));

        return Prop.ForAll(
            aboveThresholdGen.ToArbitrary(),
            amount =>
            {
                // Arrange
                var fee = CreateFee(amount, PaymentStatus.Approved);
                PlanningFee? updatedFee = null;
                var handler = CreateHandler(fee, onUpdate: f => updatedFee = f);

                var command = new TransitionFeeStatusCommand
                {
                    FeeId = fee.Id,
                    NewStatus = PaymentStatus.Paid
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                updatedFee.Should().NotBeNull();
                updatedFee!.PaymentStatus.Should().Be(PaymentStatus.Paid);

                return true;
            });
    }

    #region Test Helpers

    private static PlanningFee CreateFee(decimal amount, PaymentStatus status)
    {
        return new PlanningFee
        {
            Id = Guid.NewGuid(),
            ApplicationId = Guid.NewGuid(),
            Amount = amount,
            Currency = "GBP",
            FeeType = FeeType.ApplicationFee,
            Description = "Test planning fee",
            PaymentStatus = status,
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            CreatedBy = "planning-manager-001"
        };
    }

    private static TransitionFeeStatusCommandHandler CreateHandler(
        PlanningFee fee,
        Action<PlanningFee>? onUpdate = null)
    {
        var feeRepoMock = new Mock<IRepository<PlanningFee>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();
        var stateMachine = new FeeStatusStateMachine();
        var feeSettings = Options.Create(new PlanningFeeSettings
        {
            ApprovalThreshold = DefaultThreshold
        });

        // Setup repository to return the fee
        feeRepoMock
            .Setup(r => r.GetByIdAsync(fee.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fee);

        // Capture Update call
        feeRepoMock
            .Setup(r => r.Update(It.IsAny<PlanningFee>()))
            .Callback<PlanningFee>(f => onUpdate?.Invoke(f));

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<FeeDto>(It.IsAny<PlanningFee>()))
            .Returns((PlanningFee f) => new FeeDto
            {
                Id = f.Id,
                ApplicationId = f.ApplicationId,
                Amount = f.Amount,
                Currency = f.Currency,
                FeeType = f.FeeType.ToString(),
                Description = f.Description,
                PaymentStatus = f.PaymentStatus.ToString(),
                ApprovedBy = f.ApprovedBy,
                ApprovedAt = f.ApprovedAt,
                ApprovalNotes = f.ApprovalNotes,
                CreatedAt = f.CreatedAt
            });

        var loggerMock = new Mock<ILogger<TransitionFeeStatusCommandHandler>>();

        return new TransitionFeeStatusCommandHandler(
            feeRepoMock.Object,
            stateMachine,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object,
            feeSettings,
            loggerMock.Object);
    }

    #endregion
}
