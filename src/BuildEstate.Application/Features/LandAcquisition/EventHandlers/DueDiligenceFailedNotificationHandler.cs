using BuildEstate.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// Handles the DueDiligenceFailedNotification by emitting a notification event.
/// The engine resolves recipients from configured rules.
/// Validates: Requirement 19.3
/// </summary>
public sealed class DueDiligenceFailedNotificationHandler
    : INotificationHandler<DueDiligenceFailedNotification>
{
    private readonly INotificationEngine _notificationEngine;
    private readonly ILogger<DueDiligenceFailedNotificationHandler> _logger;

    public DueDiligenceFailedNotificationHandler(
        INotificationEngine notificationEngine,
        ILogger<DueDiligenceFailedNotificationHandler> logger)
    {
        _notificationEngine = notificationEngine;
        _logger = logger;
    }

    public async Task Handle(
        DueDiligenceFailedNotification notification,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Due diligence {DueDiligenceId} failed for opportunity {OpportunityId}. Emitting notification event",
            notification.DueDiligenceId,
            notification.OpportunityId);

        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "DueDiligenceFailed",
            Module = "LandAcquisition",
            EntityId = notification.OpportunityId,
            EntityType = "LandOpportunity",
            RelatedUrl = $"/land-acquisition/opportunities/{notification.OpportunityId}",
            Variables = new Dictionary<string, string>
            {
                ["opportunityName"] = "Opportunity",
                ["checkType"] = "General"
            },
            TriggeredByUserId = null
        }, cancellationToken);
    }
}
