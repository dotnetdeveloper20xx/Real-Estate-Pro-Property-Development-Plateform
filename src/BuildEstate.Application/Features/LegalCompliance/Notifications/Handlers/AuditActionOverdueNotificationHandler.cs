using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the AuditActionOverdueEvent by sending a notification to the
/// Legal_Compliance_Officer when an audit record action becomes overdue.
///
/// Validates: Requirements 12.6, 12.7
/// </summary>
public sealed class AuditActionOverdueNotificationHandler
    : INotificationHandler<AuditActionOverdueEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<AuditActionOverdueNotificationHandler> _logger;

    public AuditActionOverdueNotificationHandler(
        INotificationService notificationService,
        ILogger<AuditActionOverdueNotificationHandler> logger)
    {
        _notificationService = notificationService;
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

        var message = $"Audit record action is overdue. Type: {notification.AuditType}, " +
                      $"Scope: '{notification.Scope}'. " +
                      $"Action was due on {notification.ActionDueDate:dd MMM yyyy}. " +
                      $"Please review and complete the required actions.";

        await _notificationService.SendToRoleAsync(
            "Legal_Compliance_Officer",
            "AuditActionOverdue",
            message,
            notification.AuditRecordId,
            cancellationToken);
    }
}
