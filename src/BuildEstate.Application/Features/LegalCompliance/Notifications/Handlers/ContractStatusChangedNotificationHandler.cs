using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LegalCompliance.Notifications.Handlers;

/// <summary>
/// Handles the ContractStatusChangedEvent by emitting a notification event when
/// a contract transitions to Executed or Terminated.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 12.2, 12.7
/// </summary>
public sealed class ContractStatusChangedNotificationHandler
    : INotificationHandler<ContractStatusChangedEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<ContractStatusChangedNotificationHandler> _logger;

    public ContractStatusChangedNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<ContractStatusChangedNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
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
            await _notificationEngine.EmitAsync(new NotificationEvent
            {
                EventType = $"Contract{notification.NewStatus}",
                Module = "LegalCompliance",
                EntityId = notification.ContractId,
                EntityType = "LegalContract",
                RelatedUrl = $"/legal-compliance/contracts/{notification.ContractId}",
                Variables = new Dictionary<string, string>
                {
                    ["contractReference"] = notification.ContractReference,
                    ["previousStatus"] = notification.PreviousStatus.ToString(),
                    ["newStatus"] = notification.NewStatus.ToString()
                },
                TriggeredByUserId = notification.UserId
            }, cancellationToken);
        }
    }
}
