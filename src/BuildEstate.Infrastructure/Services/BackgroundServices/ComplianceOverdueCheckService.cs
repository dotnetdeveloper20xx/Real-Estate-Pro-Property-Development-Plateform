using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Events;
using BuildEstate.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services.BackgroundServices;

/// <summary>
/// Background service that runs daily to identify and mark overdue ComplianceRequirements,
/// overdue AuditRecord actions, and documents approaching retention expiry.
/// Sends notifications to responsible parties and publishes AuditActionOverdueEvent for overdue audit records.
/// 
/// Validates: Requirements 6.6, 8.8, 9.6
/// </summary>
public sealed class ComplianceOverdueCheckService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ComplianceOverdueCheckService> _logger;
    private readonly TimeSpan _checkInterval;

    /// <summary>
    /// Initializes the background service with a daily check interval.
    /// </summary>
    public ComplianceOverdueCheckService(
        IServiceScopeFactory scopeFactory,
        ILogger<ComplianceOverdueCheckService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _checkInterval = TimeSpan.FromHours(24);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "ComplianceOverdueCheckService started. Checking for overdue items every {Interval}",
            _checkInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOverdueItemsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing overdue compliance items");
            }

            try
            {
                await Task.Delay(_checkInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("ComplianceOverdueCheckService stopped");
    }

    /// <summary>
    /// Identifies overdue ComplianceRequirements, AuditRecords, and documents approaching
    /// retention expiry. Marks them as overdue, sends notifications, and publishes domain events.
    /// </summary>
    private async Task ProcessOverdueItemsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BuildEstateDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var publisher = scope.ServiceProvider.GetRequiredService<IPublisher>();

        var utcNow = DateTime.UtcNow;

        await ProcessOverdueComplianceRequirementsAsync(dbContext, notificationService, utcNow, cancellationToken);
        await ProcessOverdueAuditRecordsAsync(dbContext, notificationService, publisher, utcNow, cancellationToken);
        await ProcessDocumentRetentionExpiryAsync(dbContext, notificationService, utcNow, cancellationToken);
    }

    /// <summary>
    /// Identifies active ComplianceRequirements whose NextDueDate has passed
    /// and sends notifications to the responsible role.
    /// </summary>
    private async Task ProcessOverdueComplianceRequirementsAsync(
        BuildEstateDbContext dbContext,
        INotificationService notificationService,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var overdueRequirements = await dbContext.ComplianceRequirements
            .Where(cr => cr.Status == ComplianceRequirementStatus.Active
                         && cr.NextDueDate != null
                         && cr.NextDueDate < utcNow)
            .ToListAsync(cancellationToken);

        if (overdueRequirements.Count == 0)
        {
            _logger.LogDebug("No overdue compliance requirements found during this check cycle");
            return;
        }

        _logger.LogInformation(
            "Found {Count} overdue compliance requirement(s) to process",
            overdueRequirements.Count);

        foreach (var requirement in overdueRequirements)
        {
            try
            {
                await notificationService.SendToRoleAsync(
                    requirement.ResponsibleRole,
                    "ComplianceRequirementOverdue",
                    $"Compliance requirement '{requirement.Name}' (Category: {requirement.Category}) is overdue. " +
                    $"Due date was {requirement.NextDueDate:yyyy-MM-dd}. Please complete the required check.",
                    requirement.Id,
                    cancellationToken);

                _logger.LogInformation(
                    "Notification sent for overdue ComplianceRequirement {RequirementId} '{RequirementName}' " +
                    "(Category: {Category}, NextDueDate: {NextDueDate}, ResponsibleRole: {ResponsibleRole})",
                    requirement.Id,
                    requirement.Name,
                    requirement.Category,
                    requirement.NextDueDate,
                    requirement.ResponsibleRole);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send overdue notification for ComplianceRequirement {RequirementId}",
                    requirement.Id);
            }
        }
    }

    /// <summary>
    /// Identifies AuditRecords with Status of ActionsRequired or RemediationInProgress
    /// whose ActionDueDate has passed and are not already marked overdue. Sets IsOverdue = true,
    /// sends notifications, and publishes AuditActionOverdueEvent.
    /// </summary>
    private async Task ProcessOverdueAuditRecordsAsync(
        BuildEstateDbContext dbContext,
        INotificationService notificationService,
        IPublisher publisher,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var overdueAuditRecords = await dbContext.AuditRecords
            .Where(ar => (ar.Status == AuditRecordStatus.ActionsRequired
                          || ar.Status == AuditRecordStatus.RemediationInProgress)
                         && ar.ActionDueDate != null
                         && ar.ActionDueDate < utcNow
                         && !ar.IsOverdue)
            .ToListAsync(cancellationToken);

        if (overdueAuditRecords.Count == 0)
        {
            _logger.LogDebug("No overdue audit records found during this check cycle");
            return;
        }

        _logger.LogInformation(
            "Found {Count} overdue audit record(s) to process",
            overdueAuditRecords.Count);

        foreach (var auditRecord in overdueAuditRecords)
        {
            auditRecord.IsOverdue = true;
            auditRecord.UpdatedAt = utcNow;
            auditRecord.UpdatedBy = "System:ComplianceOverdueCheckService";
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Marked {Count} audit record(s) as overdue",
            overdueAuditRecords.Count);

        // Publish events and send notifications for each overdue audit record
        foreach (var auditRecord in overdueAuditRecords)
        {
            try
            {
                var overdueEvent = new AuditActionOverdueEvent
                {
                    AuditRecordId = auditRecord.Id,
                    ActionDueDate = auditRecord.ActionDueDate!.Value,
                    AuditType = auditRecord.AuditType,
                    Scope = auditRecord.Scope,
                    Timestamp = utcNow
                };

                await publisher.Publish(overdueEvent, cancellationToken);

                _logger.LogInformation(
                    "Published AuditActionOverdueEvent for AuditRecord {AuditRecordId} " +
                    "(AuditType: {AuditType}, Scope: {Scope}, ActionDueDate: {ActionDueDate})",
                    auditRecord.Id,
                    auditRecord.AuditType,
                    auditRecord.Scope,
                    auditRecord.ActionDueDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to publish AuditActionOverdueEvent for AuditRecord {AuditRecordId}",
                    auditRecord.Id);
            }

            try
            {
                await notificationService.SendToRoleAsync(
                    "Legal_Compliance_Officer",
                    "AuditActionOverdue",
                    $"Audit record action is overdue. Type: {auditRecord.AuditType}, " +
                    $"Scope: '{auditRecord.Scope}', Due date was {auditRecord.ActionDueDate:yyyy-MM-dd}.",
                    auditRecord.Id,
                    cancellationToken);

                _logger.LogInformation(
                    "Notification sent for overdue AuditRecord {AuditRecordId}",
                    auditRecord.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send overdue notification for AuditRecord {AuditRecordId}",
                    auditRecord.Id);
            }
        }
    }

    /// <summary>
    /// Identifies LegalDocuments whose RetentionExpiryDate is within 30 days of now
    /// and sends a notification to the Legal_Compliance_Officer for each.
    /// 
    /// Validates: Requirement 8.8
    /// </summary>
    private async Task ProcessDocumentRetentionExpiryAsync(
        BuildEstateDbContext dbContext,
        INotificationService notificationService,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var expiryThreshold = utcNow.AddDays(30);

        var expiringDocuments = await dbContext.LegalDocuments
            .Where(ld => ld.RetentionExpiryDate != null
                         && ld.RetentionExpiryDate > utcNow
                         && ld.RetentionExpiryDate <= expiryThreshold
                         && !ld.IsDeleted)
            .ToListAsync(cancellationToken);

        if (expiringDocuments.Count == 0)
        {
            _logger.LogDebug("No documents approaching retention expiry found during this check cycle");
            return;
        }

        _logger.LogInformation(
            "Found {Count} document(s) with retention expiry within 30 days",
            expiringDocuments.Count);

        foreach (var document in expiringDocuments)
        {
            try
            {
                await notificationService.SendToRoleAsync(
                    "Legal_Compliance_Officer",
                    "DocumentRetentionExpiring",
                    $"Document '{document.FileName}' (Type: {document.DocumentType}) has a retention period " +
                    $"expiring on {document.RetentionExpiryDate:yyyy-MM-dd}. Please review and take appropriate action.",
                    document.Id,
                    cancellationToken);

                _logger.LogInformation(
                    "Notification sent for document retention expiry: Document {DocumentId} '{FileName}' " +
                    "(DocumentType: {DocumentType}, RetentionExpiryDate: {RetentionExpiryDate})",
                    document.Id,
                    document.FileName,
                    document.DocumentType,
                    document.RetentionExpiryDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send retention expiry notification for LegalDocument {DocumentId}",
                    document.Id);
            }
        }
    }
}
