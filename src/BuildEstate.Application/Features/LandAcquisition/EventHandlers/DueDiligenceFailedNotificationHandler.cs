using BuildEstate.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// Handles the DueDiligenceFailedNotification by notifying the Acquisition Manager
/// associated with the parent opportunity.
/// Validates: Requirement 19.3
/// </summary>
public sealed class DueDiligenceFailedNotificationHandler
    : INotificationHandler<DueDiligenceFailedNotification>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<DueDiligenceFailedNotificationHandler> _logger;

    public DueDiligenceFailedNotificationHandler(
        INotificationService notificationService,
        ILogger<DueDiligenceFailedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(
        DueDiligenceFailedNotification notification,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Due diligence {DueDiligenceId} failed for opportunity {OpportunityId}. Notifying Acquisition Manager {CreatedBy}",
            notification.DueDiligenceId,
            notification.OpportunityId,
            notification.OpportunityCreatedBy);

        var message = $"A due diligence check has failed for your opportunity. Please review the findings and determine next steps.";

        await _notificationService.SendAsync(
            notification.OpportunityCreatedBy,
            "DueDiligenceFailed",
            message,
            notification.DueDiligenceId,
            cancellationToken);
    }
}
