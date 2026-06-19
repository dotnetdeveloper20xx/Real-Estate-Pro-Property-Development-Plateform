using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the AuditActionOverdueEvent by emitting a notification event.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 12.6, 12.7
/// </summary>
public sealed class AuditActionOverdueNotificationHandler
    : INotificationHandler<AuditActionOverdueEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<AuditActionOverdueNotificationHandler> _logger;

    public AuditActionOverdueNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<AuditActionOverdueNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(AuditActionOverdueEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Audit record {AuditRecordId} action is overdue. Type: {AuditType}, Scope: {Scope}, Due date: {ActionDueDate}",
            notification.AuditRecordId,
            notification.AuditType,
            notification.Scope,
            notification.ActionDueDate);

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "AuditActionOverdue",
            Module = "LegalCompliance",
            EntityId = notification.AuditRecordId,
            EntityType = "AuditRecord",
            RelatedUrl = $"/legal-compliance/audit-records",
            Variables = new Dictionary<string, string>
            {
                ["auditType"] = notification.AuditType.ToString(),
                ["scope"] = notification.Scope,
                ["actionDueDate"] = notification.ActionDueDate.ToString("dd MMM yyyy")
            },
            TriggeredByUserId = null
        }, cancellationToken);
    }
}
