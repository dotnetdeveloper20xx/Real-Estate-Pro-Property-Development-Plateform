using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.PlanningApprovals.EventHandlers;

/// <summary>
/// Handles the AppealAllowedDomainEvent by transitioning the parent PlanningApplication
/// status based on the appeal outcome type, and sending notifications to relevant roles.
///
/// - AppealOutcomeType.Approved → parent status becomes Approved
/// - AppealOutcomeType.ApprovedWithConditions → parent status becomes ApprovedWithConditions
///
/// Validates: Requirements 6.6, 6.8
/// </summary>
public sealed class AppealAllowedEventHandler : INotificationHandler<AppealAllowedDomainEvent>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AppealAllowedEventHandler> _logger;

    public AppealAllowedEventHandler(
        IRepository<PlanningApplication> applicationRepository,
        IUnitOfWork unitOfWork,
        INotificationService notificationService,
        ILogger<AppealAllowedEventHandler> logger)
    {
        _applicationRepository = applicationRepository;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(AppealAllowedDomainEvent notification, CancellationToken cancellationToken)
    {
        var application = await _applicationRepository.GetByIdAsync(notification.ApplicationId, cancellationToken);

        if (application is null)
        {
            _logger.LogError(
                "AppealAllowedEventHandler: Parent application {ApplicationId} not found for appeal {AppealId}",
                notification.ApplicationId, notification.AppealId);
            throw new EntityNotFoundException(nameof(PlanningApplication), notification.ApplicationId);
        }

        // Determine new status based on appeal outcome type
        var newStatus = notification.OutcomeType switch
        {
            AppealOutcomeType.Approved => PlanningApplicationStatus.Approved,
            AppealOutcomeType.ApprovedWithConditions => PlanningApplicationStatus.ApprovedWithConditions,
            _ => throw new InvalidOperationException($"Unexpected AppealOutcomeType: {notification.OutcomeType}")
        };

        var previousStatus = application.Status;
        application.Status = newStatus;
        application.DecisionDate = notification.DecisionDate;
        application.UpdatedAt = DateTime.UtcNow;
        application.UpdatedBy = "system";

        _applicationRepository.Update(application);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Application {ApplicationId} status transitioned from {PreviousStatus} to {NewStatus} via appeal {AppealId} with outcome {OutcomeType}",
            notification.ApplicationId, previousStatus, newStatus, notification.AppealId, notification.OutcomeType);

        // Send notifications to Planning_Manager and Legal_Compliance_Officer
        var message = $"Planning appeal has been allowed. Application status updated to {newStatus}.";

        await _notificationService.SendToRoleAsync(
            "PlanningManager",
            "AppealAllowed",
            message,
            notification.ApplicationId,
            cancellationToken);

        await _notificationService.SendToRoleAsync(
            "LegalComplianceOfficer",
            "AppealAllowed",
            message,
            notification.ApplicationId,
            cancellationToken);
    }
}
