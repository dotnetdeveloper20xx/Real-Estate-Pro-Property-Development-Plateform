using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the MilestoneOverdueDomainEvent by sending a notification to the
/// Planning_Manager role informing them that a milestone has become overdue.
///
/// Validates: Requirements 9.6, 12.5
/// </summary>
public sealed class MilestoneOverdueEventHandler : INotificationHandler<MilestoneOverdueDomainEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<MilestoneOverdueEventHandler> _logger;

    public MilestoneOverdueEventHandler(
        INotificationService notificationService,
        ILogger<MilestoneOverdueEventHandler> logger)
    {
        _notificationService = notificationService;
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

        var message = $"Planning milestone '{notification.MilestoneType}' is overdue. " +
                      $"The target date was {notification.TargetDate:dd MMM yyyy}. Please review and take action.";

        await _notificationService.SendToRoleAsync(
            "PlanningManager",
            "MilestoneOverdue",
            message,
            notification.ApplicationId,
            cancellationToken);
    }
}
