using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the AllConditionsDischargedDomainEvent by sending a notification
/// to the Planning_Manager role indicating all conditions have been discharged.
///
/// Validates: Requirements 5.6
/// </summary>
public sealed class AllConditionsDischargedEventHandler : INotificationHandler<AllConditionsDischargedDomainEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<AllConditionsDischargedEventHandler> _logger;

    public AllConditionsDischargedEventHandler(
        INotificationService notificationService,
        ILogger<AllConditionsDischargedEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(AllConditionsDischargedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "All {TotalConditions} conditions discharged for application {ApplicationId} at {DischargedAt}",
            notification.TotalConditions,
            notification.ApplicationId,
            notification.DischargedAt);

        var message = $"All {notification.TotalConditions} planning conditions have been discharged. " +
                      $"All obligations for this application are now fulfilled.";

        await _notificationService.SendToRoleAsync(
            "PlanningManager",
            "AllConditionsDischarged",
            message,
            notification.ApplicationId,
            cancellationToken);
    }
}
