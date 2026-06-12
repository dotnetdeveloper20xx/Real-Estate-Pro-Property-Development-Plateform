using BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CheckOverdueMilestones;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Tests for the CheckOverdueMilestonesCommandHandler.
/// Validates that milestones with Status = Pending and TargetDate in the past
/// are marked as Overdue and raise MilestoneOverdueDomainEvent.
///
/// **Validates: Requirements 9.5, 9.6**
/// </summary>
public class CheckOverdueMilestonesTests
{
    private readonly Mock<IRepository<PlanningMilestone>> _milestoneRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ILogger<CheckOverdueMilestonesCommandHandler>> _loggerMock;
    private readonly CheckOverdueMilestonesCommandHandler _handler;

    public CheckOverdueMilestonesTests()
    {
        _milestoneRepoMock = new Mock<IRepository<PlanningMilestone>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _loggerMock = new Mock<ILogger<CheckOverdueMilestonesCommandHandler>>();

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _handler = new CheckOverdueMilestonesCommandHandler(
            _milestoneRepoMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_WithOverduePendingMilestones_MarksThemAsOverdue()
    {
        // Arrange
        var milestone1 = CreatePendingMilestone(DateTime.UtcNow.AddDays(-5));
        var milestone2 = CreatePendingMilestone(DateTime.UtcNow.AddDays(-1));

        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone> { milestone1, milestone2 }.AsAsyncQueryable());

        // Act
        var result = await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        result.Should().Be(2);
        milestone1.Status.Should().Be(MilestoneStatus.Overdue);
        milestone2.Status.Should().Be(MilestoneStatus.Overdue);
    }

    [Fact]
    public async Task Handle_WithOverdueMilestones_RaisesMilestoneOverdueDomainEvent()
    {
        // Arrange
        var milestone = CreatePendingMilestone(DateTime.UtcNow.AddDays(-3));

        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone> { milestone }.AsAsyncQueryable());

        // Act
        await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        milestone.DomainEvents.Should().HaveCount(1);
        milestone.DomainEvents.First().Should().BeOfType<Domain.Events.MilestoneOverdueDomainEvent>();
    }

    [Fact]
    public async Task Handle_WithNoOverdueMilestones_ReturnsZero()
    {
        // Arrange — all milestones have future target dates
        var futureMilestone = CreatePendingMilestone(DateTime.UtcNow.AddDays(10));

        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone> { futureMilestone }.AsAsyncQueryable());

        // Act
        var result = await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        result.Should().Be(0);
        futureMilestone.Status.Should().Be(MilestoneStatus.Pending);
    }

    [Fact]
    public async Task Handle_WithNoOverdueMilestones_DoesNotSaveChanges()
    {
        // Arrange — empty list, nothing to update
        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone>().AsAsyncQueryable());

        // Act
        var result = await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        result.Should().Be(0);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_IgnoresCompletedMilestones()
    {
        // Arrange — a milestone with Status = Completed should not be marked overdue
        var completedMilestone = new PlanningMilestone
        {
            Id = Guid.NewGuid(),
            ApplicationId = Guid.NewGuid(),
            MilestoneType = MilestoneType.SubmissionDate,
            Status = MilestoneStatus.Completed,
            TargetDate = DateTime.UtcNow.AddDays(-10),
            ActualDate = DateTime.UtcNow.AddDays(-8),
            VarianceDays = 2,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            CreatedBy = "test-user"
        };

        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone> { completedMilestone }.AsAsyncQueryable());

        // Act
        var result = await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        result.Should().Be(0);
        completedMilestone.Status.Should().Be(MilestoneStatus.Completed);
    }

    [Fact]
    public async Task Handle_IgnoresDeletedMilestones()
    {
        // Arrange — a soft-deleted pending milestone with past target date
        var deletedMilestone = CreatePendingMilestone(DateTime.UtcNow.AddDays(-5));
        deletedMilestone.IsDeleted = true;

        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone> { deletedMilestone }.AsAsyncQueryable());

        // Act
        var result = await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        result.Should().Be(0);
        deletedMilestone.Status.Should().Be(MilestoneStatus.Pending);
    }

    [Fact]
    public async Task Handle_SetsUpdatedAtAndUpdatedByOnOverdueMilestones()
    {
        // Arrange
        var milestone = CreatePendingMilestone(DateTime.UtcNow.AddDays(-2));

        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone> { milestone }.AsAsyncQueryable());

        // Act
        await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        milestone.UpdatedAt.Should().NotBeNull();
        milestone.UpdatedBy.Should().Be("System");
    }

    [Fact]
    public async Task Handle_CallsUpdateAndSaveForOverdueMilestones()
    {
        // Arrange
        var milestone = CreatePendingMilestone(DateTime.UtcNow.AddDays(-1));

        _milestoneRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningMilestone> { milestone }.AsAsyncQueryable());

        // Act
        await _handler.Handle(new CheckOverdueMilestonesCommand(), CancellationToken.None);

        // Assert
        _milestoneRepoMock.Verify(r => r.Update(milestone), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #region Helpers

    private static PlanningMilestone CreatePendingMilestone(DateTime targetDate)
    {
        return new PlanningMilestone
        {
            Id = Guid.NewGuid(),
            ApplicationId = Guid.NewGuid(),
            MilestoneType = MilestoneType.TargetDecisionDate,
            Status = MilestoneStatus.Pending,
            TargetDate = targetDate,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            CreatedBy = "test-user"
        };
    }

    #endregion
}
