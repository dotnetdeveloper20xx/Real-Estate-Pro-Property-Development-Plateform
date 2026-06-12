using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the ContractStatusChangedEvent by sending notifications when a contract
/// transitions to Executed or Terminated. Notifies the Legal_Compliance_Officer
/// and Acquisition_Manager.
///
/// Validates: Requirements 12.2, 12.7
/// </summary>
public sealed class ContractStatusChangedNotificationHandler
    : INotificationHandler<ContractStatusChangedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<ContractStatusChangedNotificationHandler> _logger;

    public ContractStatusChangedNotificationHandler(
        INotificationService notificationService,
        ILogger<ContractStatusChangedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(ContractStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Contract {ContractReference} status changed from {PreviousStatus} to {NewStatus} by {UserId}",
            notification.ContractReference,
            notification.PreviousStatus,
            notification.NewStatus,
            notification.UserId);

        if (notification.NewStatus is LegalContractStatus.Executed or LegalContractStatus.Terminated)
        {
            var action = notification.NewStatus == LegalContractStatus.Executed ? "executed" : "terminated";
            var message = $"Contract '{notification.ContractReference}' has been {action}. " +
                          $"Previous status: {notification.PreviousStatus}. Please review accordingly.";

            await _notificationService.SendToRoleAsync(
                "Legal_Compliance_Officer",
                $"Contract{notification.NewStatus}",
                message,
                notification.ContractId,
                cancellationToken);

            await _notificationService.SendToRoleAsync(
                "Acquisition_Manager",
                $"Contract{notification.NewStatus}",
                message,
                notification.ContractId,
                cancellationToken);
        }
    }
}
