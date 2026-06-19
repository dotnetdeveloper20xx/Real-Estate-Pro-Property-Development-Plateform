using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the ApplicationStatusChangedDomainEvent by emitting a notification event
/// when a planning application reaches a decision status.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 12.1, 12.6
/// </summary>
public sealed class ApplicationStatusChangedEventHandler : INotificationHandler<ApplicationStatusChangedDomainEvent>
{
    private static readonly HashSet<PlanningApplicationStatus> DecisionStatuses = new()
    {
        PlanningApplicationStatus.Approved,
        PlanningApplicationStatus.ApprovedWithConditions,
        PlanningApplicationStatus.Refused
    };

    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<ApplicationStatusChangedEventHandler> _logger;

    public ApplicationStatusChangedEventHandler(
        INotificationEngine notificationEngine,
        ILogger<ApplicationStatusChangedEventHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(ApplicationStatusChangedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Application {ApplicationId} status changed from {PreviousStatus} to {NewStatus} by {ChangedBy} at {ChangedAt}",
            notification.ApplicationId,
            notification.PreviousStatus,
            notification.NewStatus,
            notification.ChangedBy,
            notification.ChangedAt);

        if (!DecisionStatuses.Contains(notification.NewStatus))
        {
            return;
        }

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "ApplicationStatusChanged",
            Module = "PlanningApprovals",
            EntityId = notification.ApplicationId,
            EntityType = "PlanningApplication",
            RelatedUrl = $"/planning-approvals/applications/{notification.ApplicationId}",
            Variables = new Dictionary<string, string>
            {
                ["applicationReference"] = notification.ApplicationId.ToString(),
                ["newStatus"] = FormatStatus(notification.NewStatus),
                ["previousStatus"] = FormatStatus(notification.PreviousStatus)
            },
            TriggeredByUserId = notification.ChangedBy
        }, cancellationToken);
    }

    private static string FormatStatus(PlanningApplicationStatus status) => status switch
    {
        PlanningApplicationStatus.Approved => "Approved",
        PlanningApplicationStatus.ApprovedWithConditions => "Approved with Conditions",
        PlanningApplicationStatus.Refused => "Refused",
        _ => status.ToString()
    };
}
