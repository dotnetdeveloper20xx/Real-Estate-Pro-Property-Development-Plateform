using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the InsuranceExpiringEvent by sending notifications to the
/// Legal_Compliance_Officer when an insurance policy is expiring soon or has expired.
/// Also notifies the Finance_Director when a policy has expired.
///
/// Validates: Requirements 12.3, 12.7
/// </summary>
public sealed class InsuranceExpiringNotificationHandler
    : INotificationHandler<InsuranceExpiringEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<InsuranceExpiringNotificationHandler> _logger;

    public InsuranceExpiringNotificationHandler(
        INotificationService notificationService,
        ILogger<InsuranceExpiringNotificationHandler> logger)
    {
        _notificationService = notificationService;
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

        var statusDescription = notification.InsuranceStatus == InsuranceStatus.Expired
            ? "has expired"
            : "is expiring soon";

        var message = $"Insurance policy '{notification.PolicyNumber}' {statusDescription}. " +
                      $"Expiry date: {notification.ExpiryDate:dd MMM yyyy}. " +
                      $"Please review and arrange renewal if required.";

        await _notificationService.SendToRoleAsync(
            "Legal_Compliance_Officer",
            eventType,
            message,
            notification.InsuranceRecordId,
            cancellationToken);

        if (notification.InsuranceStatus == InsuranceStatus.Expired)
        {
            await _notificationService.SendToRoleAsync(
                "Finance_Director",
                eventType,
                message,
                notification.InsuranceRecordId,
                cancellationToken);
        }
    }
}
