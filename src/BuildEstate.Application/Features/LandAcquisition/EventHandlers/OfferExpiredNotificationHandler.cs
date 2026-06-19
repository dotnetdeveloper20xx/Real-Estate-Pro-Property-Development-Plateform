using BuildEstate.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// Handles the OfferExpiredNotification by emitting a notification event via the engine.
/// The engine resolves recipients, templates, and preferences from configured rules.
/// Validates: Requirement 19.2
/// </summary>
public sealed class OfferExpiredNotificationHandler
    : INotificationHandler<OfferExpiredNotification>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<OfferExpiredNotificationHandler> _logger;

    public OfferExpiredNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<OfferExpiredNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(
        OfferExpiredNotification notification,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Offer {OfferId} for opportunity {OpportunityId} has expired. Emitting notification event",
            notification.OfferId,
            notification.OpportunityId);

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "OfferExpired",
            Module = "LandAcquisition",
            EntityId = notification.OpportunityId,
            EntityType = "LandOpportunity",
            RelatedUrl = $"/land-acquisition/opportunities/{notification.OpportunityId}",
            Variables = new Dictionary<string, string>
            {
                ["opportunityName"] = "Opportunity"
            },
            TriggeredByUserId = null // System-triggered (background service)
        }, cancellationToken);
    }
}
