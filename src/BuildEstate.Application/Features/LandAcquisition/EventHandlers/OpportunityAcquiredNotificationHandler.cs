using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// Handles the OpportunityStatusTransitionedNotification when NewStatus is Acquired.
/// Emits a notification event via the engine — rules determine recipients.
/// Validates: Requirement 19.1
/// </summary>
public sealed class OpportunityAcquiredNotificationHandler
    : INotificationHandler<OpportunityStatusTransitionedNotification>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<OpportunityAcquiredNotificationHandler> _logger;

    public OpportunityAcquiredNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<OpportunityAcquiredNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(
        OpportunityStatusTransitionedNotification notification,
        CancellationToken cancellationToken)
    {
        if (notification.NewStatus != OpportunityStatus.Acquired)
        {
            return;
        }

        _logger.LogInformation(
            "Opportunity {OpportunityId} acquired. Emitting notification event",
            notification.OpportunityId);

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "OpportunityAcquired",
            Module = "LandAcquisition",
            EntityId = notification.OpportunityId,
            EntityType = "LandOpportunity",
            RelatedUrl = $"/land-acquisition/opportunities/{notification.OpportunityId}",
            Variables = new Dictionary<string, string>
            {
                ["opportunityName"] = "Opportunity"
            },
            TriggeredByUserId = notification.TransitionedBy
        }, cancellationToken);
    }
}
