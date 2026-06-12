using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the LegalCaseStatusChangedEvent by sending notifications when a legal case
/// is escalated. Notifies the Finance_Director and Legal_Compliance_Officer.
///
/// Validates: Requirements 12.1, 12.7
/// </summary>
public sealed class LegalCaseStatusChangedNotificationHandler
    : INotificationHandler<LegalCaseStatusChangedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<LegalCaseStatusChangedNotificationHandler> _logger;

    public LegalCaseStatusChangedNotificationHandler(
        INotificationService notificationService,
        ILogger<LegalCaseStatusChangedNotificationHandler> logger)
    {
        _notificationService = notificationService;
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
            var message = $"Legal case '{notification.CaseReference}' has been escalated from " +
                          $"{notification.PreviousStatus}. Reason: {notification.TransitionReason ?? "Not specified"}. " +
                          $"Immediate attention required.";

            await _notificationService.SendToRoleAsync(
                "Finance_Director",
                "LegalCaseEscalated",
                message,
                notification.LegalCaseId,
                cancellationToken);

            await _notificationService.SendToRoleAsync(
                "Legal_Compliance_Officer",
                "LegalCaseEscalated",
                message,
                notification.LegalCaseId,
                cancellationToken);
        }
    }
}
