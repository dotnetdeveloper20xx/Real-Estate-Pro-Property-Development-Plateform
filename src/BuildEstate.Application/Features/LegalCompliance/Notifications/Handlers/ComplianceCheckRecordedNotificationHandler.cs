using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the ComplianceCheckRecordedEvent by sending notifications when a
/// compliance check records a Non-Compliant outcome. Notifies the
/// Legal_Compliance_Officer and Finance_Director.
///
/// Validates: Requirements 12.4, 12.7
/// </summary>
public sealed class ComplianceCheckRecordedNotificationHandler
    : INotificationHandler<ComplianceCheckRecordedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<ComplianceCheckRecordedNotificationHandler> _logger;

    public ComplianceCheckRecordedNotificationHandler(
        INotificationService notificationService,
        ILogger<ComplianceCheckRecordedNotificationHandler> logger)
    {
        _notificationService = notificationService;
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
            var message = $"A compliance check recorded on {notification.CheckDate:dd MMM yyyy} " +
                          $"has a Non-Compliant outcome. Requirement ID: {notification.ComplianceRequirementId}. " +
                          $"Immediate review and remediation action required.";

            await _notificationService.SendToRoleAsync(
                "Legal_Compliance_Officer",
                "ComplianceCheckNonCompliant",
                message,
                notification.ComplianceCheckId,
                cancellationToken);

            await _notificationService.SendToRoleAsync(
                "Finance_Director",
                "ComplianceCheckNonCompliant",
                message,
                notification.ComplianceCheckId,
                cancellationToken);
        }
    }
}
