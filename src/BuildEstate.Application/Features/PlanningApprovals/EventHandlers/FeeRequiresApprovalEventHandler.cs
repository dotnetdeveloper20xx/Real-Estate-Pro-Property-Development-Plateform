using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the FeeRequiresApprovalDomainEvent by sending a notification to the
/// Finance_Director role when a planning fee exceeds the configured threshold
/// and requires approval before payment can proceed.
///
/// Validates: Requirements 12.4, 12.6
/// </summary>
public sealed class FeeRequiresApprovalEventHandler : INotificationHandler<FeeRequiresApprovalDomainEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<FeeRequiresApprovalEventHandler> _logger;

    public FeeRequiresApprovalEventHandler(
        INotificationService notificationService,
        ILogger<FeeRequiresApprovalEventHandler> logger)
    {
        _notificationService = notificationService;
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

        var message = $"A planning fee of {notification.Amount:N2} {notification.Currency} " +
                      $"(type: {notification.FeeType}) exceeds the approval threshold and requires your approval.";

        await _notificationService.SendToRoleAsync(
            "FinanceDirector",
            "FeeRequiresApproval",
            message,
            notification.ApplicationId,
            cancellationToken);

        _logger.LogInformation(
            "Notification sent to FinanceDirector for fee {FeeId} approval on application {ApplicationId}",
            notification.FeeId,
            notification.ApplicationId);
    }
}
