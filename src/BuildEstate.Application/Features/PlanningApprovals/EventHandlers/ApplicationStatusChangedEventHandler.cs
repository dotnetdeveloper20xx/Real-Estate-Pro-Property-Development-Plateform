using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the ApplicationStatusChangedDomainEvent by sending notifications to
/// relevant stakeholders when a planning application reaches a decision status.
///
/// - Approved / ApprovedWithConditions / Refused → Notify PlanningManager and AcquisitionManager
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

    private readonly INotificationService _notificationService;
    private readonly ILogger<ApplicationStatusChangedEventHandler> _logger;

    public ApplicationStatusChangedEventHandler(
        INotificationService notificationService,
        ILogger<ApplicationStatusChangedEventHandler> logger)
    {
        _notificationService = notificationService;
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

        var message = $"Planning application has reached a decision: {FormatStatus(notification.NewStatus)}. " +
                      $"Previous status was {FormatStatus(notification.PreviousStatus)}.";

        await _notificationService.SendToRoleAsync(
            "PlanningManager",
            "ApplicationStatusChanged",
            message,
            notification.ApplicationId,
            cancellationToken);

        await _notificationService.SendToRoleAsync(
            "AcquisitionManager",
            "ApplicationStatusChanged",
            message,
            notification.ApplicationId,
            cancellationToken);

        _logger.LogInformation(
            "Notifications sent to PlanningManager and AcquisitionManager for application {ApplicationId} decision: {NewStatus}",
            notification.ApplicationId,
            notification.NewStatus);
    }

    private static string FormatStatus(PlanningApplicationStatus status) => status switch
    {
        PlanningApplicationStatus.Approved => "Approved",
        PlanningApplicationStatus.ApprovedWithConditions => "Approved with Conditions",
        PlanningApplicationStatus.Refused => "Refused",
        _ => status.ToString()
    };
}
