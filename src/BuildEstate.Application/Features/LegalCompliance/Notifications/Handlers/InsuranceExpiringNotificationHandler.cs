using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the InsuranceExpiringEvent by emitting a notification event.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 12.3, 12.7
/// </summary>
public sealed class InsuranceExpiringNotificationHandler
    : INotificationHandler<InsuranceExpiringEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<InsuranceExpiringNotificationHandler> _logger;

    public InsuranceExpiringNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<InsuranceExpiringNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(InsuranceExpiringEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Insurance record {InsuranceRecordId} (Policy: {PolicyNumber}) status is {Status}, expiry date: {ExpiryDate}",
            notification.InsuranceRecordId,
            notification.PolicyNumber,
            notification.InsuranceStatus,
            notification.ExpiryDate);

        var eventType = notification.InsuranceStatus == InsuranceStatus.Expired
            ? "InsuranceExpired"
            : "InsuranceExpiringSoon";

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = eventType,
            Module = "LegalCompliance",
            EntityId = notification.InsuranceRecordId,
            EntityType = "InsuranceRecord",
            RelatedUrl = $"/legal-compliance/insurance",
            Variables = new Dictionary<string, string>
            {
                ["policyNumber"] = notification.PolicyNumber,
                ["expiryDate"] = notification.ExpiryDate.ToString("dd MMM yyyy"),
                ["status"] = notification.InsuranceStatus.ToString()
            },
            TriggeredByUserId = null // System-triggered
        }, cancellationToken);
    }
}
