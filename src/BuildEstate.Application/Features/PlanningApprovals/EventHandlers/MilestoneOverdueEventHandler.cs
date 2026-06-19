using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the MilestoneOverdueDomainEvent by emitting a notification event.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 9.6, 12.5
/// </summary>
public sealed class MilestoneOverdueEventHandler : INotificationHandler<MilestoneOverdueDomainEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<MilestoneOverdueEventHandler> _logger;

    public MilestoneOverdueEventHandler(
        INotificationEngine notificationEngine,
        ILogger<MilestoneOverdueEventHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(MilestoneOverdueDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Milestone {MilestoneId} of type {MilestoneType} for application {ApplicationId} is overdue. Target date was {TargetDate}",
            notification.MilestoneId,
            notification.MilestoneType,
            notification.ApplicationId,
            notification.TargetDate);

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "MilestoneOverdue",
            Module = "PlanningApprovals",
            EntityId = notification.ApplicationId,
            EntityType = "PlanningApplication",
            RelatedUrl = $"/planning-approvals/applications/{notification.ApplicationId}",
            Variables = new Dictionary<string, string>
            {
                ["milestoneType"] = notification.MilestoneType.ToString(),
                ["targetDate"] = notification.TargetDate.ToString("dd MMM yyyy")
            },
            TriggeredByUserId = null
        }, cancellationToken);
    }
}
