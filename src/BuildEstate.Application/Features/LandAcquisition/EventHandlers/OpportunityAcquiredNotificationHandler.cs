using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// Handles the OpportunityStatusTransitionedNotification when NewStatus is Acquired.
/// Sends notifications to all land acquisition roles informing them of the successful acquisition.
/// Validates: Requirement 19.1
/// </summary>
public sealed class OpportunityAcquiredNotificationHandler
    : INotificationHandler<OpportunityStatusTransitionedNotification>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<OpportunityAcquiredNotificationHandler> _logger;

    /// <summary>
    /// All land acquisition roles that should be notified when an opportunity is acquired.
    /// </summary>
    private static readonly string[] LandAcquisitionRoles =
    [
        "AcquisitionManager",
        "LegalComplianceOfficer",
        "ValuationAnalyst",
        "FinanceDirector",
        "AdminSupport"
    ];

    public OpportunityAcquiredNotificationHandler(
        INotificationService notificationService,
        ILogger<OpportunityAcquiredNotificationHandler> logger)
    {
        _notificationService = notificationService;
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
            "Opportunity {OpportunityId} acquired. Notifying all land acquisition roles",
            notification.OpportunityId);

        var message = $"Land opportunity has been successfully acquired.";

        foreach (var role in LandAcquisitionRoles)
        {
            await _notificationService.SendToRoleAsync(
                role,
                "OpportunityAcquired",
                message,
                notification.OpportunityId,
                cancellationToken);
        }
    }
}
