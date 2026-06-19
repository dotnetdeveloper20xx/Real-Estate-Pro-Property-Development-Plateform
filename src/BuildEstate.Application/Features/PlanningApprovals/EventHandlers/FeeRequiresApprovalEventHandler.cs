using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the FeeRequiresApprovalDomainEvent by emitting a notification event
/// when a planning fee exceeds the configured threshold.
/// The engine resolves recipients from configured rules.
///
/// Validates: Requirements 12.4, 12.6
/// </summary>
public sealed class FeeRequiresApprovalEventHandler : INotificationHandler<FeeRequiresApprovalDomainEvent>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<FeeRequiresApprovalEventHandler> _logger;

    public FeeRequiresApprovalEventHandler(
        INotificationEngine notificationEngine,
        ILogger<FeeRequiresApprovalEventHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(FeeRequiresApprovalDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Fee {FeeId} of type {FeeType} for application {ApplicationId} requires Finance Director approval. Amount: {Amount} {Currency}",
            notification.FeeId,
            notification.FeeType,
            notification.ApplicationId,
            notification.Amount,
            notification.Currency);

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "FeeRequiresApproval",
            Module = "PlanningApprovals",
            EntityId = notification.ApplicationId,
            EntityType = "PlanningApplication",
            RelatedUrl = $"/planning-approvals/applications/{notification.ApplicationId}",
            Variables = new Dictionary<string, string>
            {
                ["amount"] = notification.Amount.ToString("N2"),
                ["currency"] = notification.Currency,
                ["feeType"] = notification.FeeType.ToString()
            },
            TriggeredByUserId = null
        }, cancellationToken);
    }
}
