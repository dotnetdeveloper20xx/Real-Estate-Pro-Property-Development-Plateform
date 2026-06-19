using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the ComplianceCheckRecordedEvent by emitting a notification event
/// when a compliance check records a Non-Compliant outcome.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 12.4, 12.7
/// </summary>
public sealed class ComplianceCheckRecordedNotificationHandler
    : INotificationHandler<ComplianceCheckRecordedEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<ComplianceCheckRecordedNotificationHandler> _logger;

    public ComplianceCheckRecordedNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<ComplianceCheckRecordedNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(ComplianceCheckRecordedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Compliance check {ComplianceCheckId} recorded for requirement {RequirementId} with outcome {Outcome}",
            notification.ComplianceCheckId,
            notification.ComplianceRequirementId,
            notification.Outcome);

        if (notification.Outcome == ComplianceCheckOutcome.NonCompliant)
        {
            await _notificationEngine.EmitAsync(new NotificationEvent
            {
                EventType = "ComplianceCheckNonCompliant",
                Module = "LegalCompliance",
                EntityId = notification.ComplianceCheckId,
                EntityType = "ComplianceCheck",
                RelatedUrl = $"/legal-compliance/compliance/checklist",
                Variables = new Dictionary<string, string>
                {
                    ["requirementId"] = notification.ComplianceRequirementId.ToString(),
                    ["checkDate"] = notification.CheckDate.ToString("dd MMM yyyy")
                },
                TriggeredByUserId = null
            }, cancellationToken);
        }
    }
}
