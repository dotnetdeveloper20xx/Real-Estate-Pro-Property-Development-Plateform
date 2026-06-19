using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the AllConditionsDischargedDomainEvent by emitting a notification event.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 5.6
/// </summary>
public sealed class AllConditionsDischargedEventHandler : INotificationHandler<AllConditionsDischargedDomainEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<AllConditionsDischargedEventHandler> _logger;

    public AllConditionsDischargedEventHandler(
        INotificationEngine notificationEngine,
        ILogger<AllConditionsDischargedEventHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(AllConditionsDischargedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "All {TotalConditions} conditions discharged for application {ApplicationId} at {DischargedAt}",
            notification.TotalConditions,
            notification.ApplicationId,
            notification.DischargedAt);

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "AllConditionsDischarged",
            Module = "PlanningApprovals",
            EntityId = notification.ApplicationId,
            EntityType = "PlanningApplication",
            RelatedUrl = $"/planning-approvals/applications/{notification.ApplicationId}",
            Variables = new Dictionary<string, string>
            {
                ["totalConditions"] = notification.TotalConditions.ToString()
            },
            TriggeredByUserId = null
        }, cancellationToken);
    }
}
