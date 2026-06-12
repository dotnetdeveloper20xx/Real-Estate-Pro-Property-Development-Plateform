using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.ApproveFee;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Unit tests for the ApproveFeeCommandHandler validating:
/// - Fee must exist (EntityNotFoundException if not found)
/// - Fee must be in AwaitingApproval status (BusinessRuleViolationException otherwise)
/// - On success: sets Approved status, ApprovedBy, ApprovedAt, ApprovalNotes, and audit fields
///
/// **Validates: Requirements 8.5**
/// </summary>
public class ApproveFeeCommandHandlerTests
{
    private const string TestUserId = "finance-director-001";

    [Fact]
    public async Task Handle_FeeNotFound_ThrowsEntityNotFoundException()
    {
        // Arrange
        var feeId = Guid.NewGuid();
        var handler = CreateHandler(fee: null);

        var command = new ApproveFeeCommand
        {
            FeeId = feeId,
            ApprovalNotes = "Approved for payment."
        };

        // Act
        Func<Task> act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<EntityNotFoundException>();
        exception.Which.EntityType.Should().Be(nameof(PlanningFee));
        exception.Which.EntityId.Should().Be(feeId.ToString());
    }

    [Theory]
    [InlineData(PaymentStatus.Pending)]
    [InlineData(PaymentStatus.Approved)]
    [InlineData(PaymentStatus.Rejected)]
    [InlineData(PaymentStatus.Paid)]
    public async Task Handle_FeeNotInAwaitingApprovalStatus_ThrowsBusinessRuleViolationException(
        PaymentStatus currentStatus)
    {
        // Arrange
        var fee = CreateFee(currentStatus);
        var handler = CreateHandler(fee);

        var command = new ApproveFeeCommand
        {
            FeeId = fee.Id,
            ApprovalNotes = "Attempting approval."
        };

        // Act
        Func<Task> act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<BusinessRuleViolationException>();
        exception.Which.RuleName.Should().Be("FeeApprovalRequiresAwaitingApprovalStatus");
    }

    [Fact]
    public async Task Handle_FeeInAwaitingApprovalStatus_SetsApprovedStatusAndRecordsApprovalDetails()
    {
        // Arrange
        var fee = CreateFee(PaymentStatus.AwaitingApproval);
        PlanningFee? updatedFee = null;
        var handler = CreateHandler(fee, onUpdate: f => updatedFee = f);

        var command = new ApproveFeeCommand
        {
            FeeId = fee.Id,
            ApprovalNotes = "Approved after review of supporting documents."
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        updatedFee.Should().NotBeNull();
        updatedFee!.PaymentStatus.Should().Be(PaymentStatus.Approved);
        updatedFee.ApprovedBy.Should().Be(TestUserId);
        updatedFee.ApprovedAt.Should().NotBeNull();
        updatedFee.ApprovedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        updatedFee.ApprovalNotes.Should().Be("Approved after review of supporting documents.");
        updatedFee.UpdatedAt.Should().NotBeNull();
        updatedFee.UpdatedBy.Should().Be(TestUserId);
    }

    [Fact]
    public async Task Handle_WithNullApprovalNotes_SucceedsWithNullNotes()
    {
        // Arrange
        var fee = CreateFee(PaymentStatus.AwaitingApproval);
        PlanningFee? updatedFee = null;
        var handler = CreateHandler(fee, onUpdate: f => updatedFee = f);

        var command = new ApproveFeeCommand
        {
            FeeId = fee.Id,
            ApprovalNotes = null
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        updatedFee.Should().NotBeNull();
        updatedFee!.PaymentStatus.Should().Be(PaymentStatus.Approved);
        updatedFee.ApprovalNotes.Should().BeNull();
    }

    [Fact]
    public async Task Handle_ValidApproval_ReturnsFeeDto()
    {
        // Arrange
        var fee = CreateFee(PaymentStatus.AwaitingApproval);
        var handler = CreateHandler(fee);

        var command = new ApproveFeeCommand
        {
            FeeId = fee.Id,
            ApprovalNotes = "All checks passed."
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(fee.Id);
        result.PaymentStatus.Should().Be(nameof(PaymentStatus.Approved));
    }

    #region Validator Tests

    [Fact]
    public void Validate_EmptyFeeId_Fails()
    {
        // Arrange
        var validator = new ApproveFeeCommandValidator();
        var command = new ApproveFeeCommand
        {
            FeeId = Guid.Empty,
            ApprovalNotes = "Some notes."
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "FeeId");
    }

    [Fact]
    public void Validate_ValidFeeId_Succeeds()
    {
        // Arrange
        var validator = new ApproveFeeCommandValidator();
        var command = new ApproveFeeCommand
        {
            FeeId = Guid.NewGuid(),
            ApprovalNotes = null
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_ApprovalNotesExceedsMaxLength_Fails()
    {
        // Arrange
        var validator = new ApproveFeeCommandValidator();
        var command = new ApproveFeeCommand
        {
            FeeId = Guid.NewGuid(),
            ApprovalNotes = new string('x', 1001)
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ApprovalNotes");
    }

    [Fact]
    public void Validate_ApprovalNotesAtMaxLength_Succeeds()
    {
        // Arrange
        var validator = new ApproveFeeCommandValidator();
        var command = new ApproveFeeCommand
        {
            FeeId = Guid.NewGuid(),
            ApprovalNotes = new string('x', 1000)
        };

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    #endregion

    #region Test Helpers

    private static PlanningFee CreateFee(PaymentStatus status)
    {
        return new PlanningFee
        {
            Id = Guid.NewGuid(),
            ApplicationId = Guid.NewGuid(),
            Amount = 15000m,
            Currency = "GBP",
            FeeType = FeeType.ApplicationFee,
            Description = "Planning application fee",
            PaymentStatus = status,
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            CreatedBy = "planning-manager-001"
        };
    }

    private static ApproveFeeCommandHandler CreateHandler(
        PlanningFee? fee,
        Action<PlanningFee>? onUpdate = null)
    {
        var feeRepoMock = new Mock<IRepository<PlanningFee>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();

        // Setup repository to return the fee (or null)
        feeRepoMock
            .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
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
            .Returns(TestUserId);

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

        return new ApproveFeeCommandHandler(
            feeRepoMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object);
    }

    #endregion
}
