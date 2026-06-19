using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the LegalCaseStatusChangedEvent by emitting a notification event when
/// a legal case is escalated. The engine resolves recipients from configured rules.
///
/// Validates: Requirements 12.1, 12.7
/// </summary>
public sealed class LegalCaseStatusChangedNotificationHandler
    : INotificationHandler<LegalCaseStatusChangedEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<LegalCaseStatusChangedNotificationHandler> _logger;

    public LegalCaseStatusChangedNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<LegalCaseStatusChangedNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(LegalCaseStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Legal case {CaseReference} status changed from {PreviousStatus} to {NewStatus} by {UserId}",
            notification.CaseReference,
            notification.PreviousStatus,
            notification.NewStatus,
            notification.UserId);

        if (notification.NewStatus == LegalCaseStatus.Escalated)
        {
            await _notificationEngine.EmitAsync(new NotificationEvent
            {
                EventType = "LegalCaseEscalated",
                Module = "LegalCompliance",
                EntityId = notification.LegalCaseId,
                EntityType = "LegalCase",
                RelatedUrl = $"/legal-compliance/cases/{notification.LegalCaseId}",
                Variables = new Dictionary<string, string>
                {
                    ["caseReference"] = notification.CaseReference,
                    ["previousStatus"] = notification.PreviousStatus.ToString(),
                    ["reason"] = notification.TransitionReason ?? "Not specified"
                },
                TriggeredByUserId = notification.UserId
            }, cancellationToken);
        }
    }
}
