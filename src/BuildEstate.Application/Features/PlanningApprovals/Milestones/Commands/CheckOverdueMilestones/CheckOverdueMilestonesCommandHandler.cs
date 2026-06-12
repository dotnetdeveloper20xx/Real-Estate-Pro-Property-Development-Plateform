using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CheckOverdueMilestones;

/// <summary>
/// Handles the CheckOverdueMilestonesCommand by querying all PlanningMilestones
/// where Status is Pending and TargetDate has been exceeded. Each qualifying
/// milestone is marked as Overdue and a MilestoneOverdueDomainEvent is raised
/// to trigger notifications to the responsible Planning Manager.
/// </summary>
public sealed class CheckOverdueMilestonesCommandHandler : IRequestHandler<CheckOverdueMilestonesCommand, int>
{
    private readonly IRepository<PlanningMilestone> _milestoneRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CheckOverdueMilestonesCommandHandler> _logger;

    public CheckOverdueMilestonesCommandHandler(
        IRepository<PlanningMilestone> milestoneRepository,
        IUnitOfWork unitOfWork,
        ILogger<CheckOverdueMilestonesCommandHandler> logger)
    {
        _milestoneRepository = milestoneRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<int> Handle(CheckOverdueMilestonesCommand request, CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;

        // 1. Query all milestones where Status == Pending AND TargetDate < now
        var overdueMilestones = await _milestoneRepository.Query()
            .Where(m => m.Status == MilestoneStatus.Pending && m.TargetDate < utcNow && !m.IsDeleted)
            .ToListAsync(cancellationToken);

        if (overdueMilestones.Count == 0)
        {
            _logger.LogInformation("No overdue milestones detected at {CheckTime}", utcNow);
            return 0;
        }

        // 2. For each overdue milestone: set Status = Overdue and raise domain event
        foreach (var milestone in overdueMilestones)
        {
            milestone.MarkAsOverdue();
            milestone.UpdatedAt = utcNow;
            milestone.UpdatedBy = "System";

            _milestoneRepository.Update(milestone);

            _logger.LogInformation(
                "Milestone {MilestoneId} for application {ApplicationId} marked overdue. " +
                "Type: {MilestoneType}, TargetDate: {TargetDate}",
                milestone.Id, milestone.ApplicationId, milestone.MilestoneType, milestone.TargetDate);
        }

        // 3. Save changes (domain events will be dispatched by the infrastructure)
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "{Count} milestone(s) marked as overdue at {CheckTime}",
            overdueMilestones.Count, utcNow);

        return overdueMilestones.Count;
    }
}
