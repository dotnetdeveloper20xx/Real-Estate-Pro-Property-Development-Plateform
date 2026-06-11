using BuildEstate.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// Handles the OfferExpiredNotification by notifying the Acquisition Manager who created the offer.
/// Validates: Requirement 19.2
/// </summary>
public sealed class OfferExpiredNotificationHandler
    : INotificationHandler<OfferExpiredNotification>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<OfferExpiredNotificationHandler> _logger;

    public OfferExpiredNotificationHandler(
        INotificationService notificationService,
        ILogger<OfferExpiredNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(
        OfferExpiredNotification notification,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Offer {OfferId} for opportunity {OpportunityId} has expired. Notifying creator {CreatedBy}",
            notification.OfferId,
            notification.OpportunityId,
            notification.CreatedBy);

        var message = $"Your offer has expired. Please review and take appropriate action.";

        await _notificationService.SendAsync(
            notification.CreatedBy,
            "OfferExpired",
            message,
            notification.OfferId,
            cancellationToken);
    }
}
