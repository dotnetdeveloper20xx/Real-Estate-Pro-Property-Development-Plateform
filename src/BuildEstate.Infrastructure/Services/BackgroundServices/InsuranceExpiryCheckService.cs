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
/// Background service that runs daily to manage insurance policy expiry transitions.
/// 
/// 1. Queries InsuranceRecords with Status=Active where ExpiryDate is within 30 days → transitions to ExpiringSoon
/// 2. Queries InsuranceRecords with Status=ExpiringSoon where ExpiryDate has passed → transitions to Expired
/// 3. Publishes InsuranceExpiringEvent for each transition and sends notifications.
/// 
/// Validates: Requirements 7.4, 7.5
/// </summary>
public sealed class InsuranceExpiryCheckService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<InsuranceExpiryCheckService> _logger;
    private readonly TimeSpan _checkInterval;

    private const int ExpiryWarningDays = 30;
    private const string SystemUserId = "System:InsuranceExpiryCheckService";

    /// <summary>
    /// Initializes the background service with a daily check interval.
    /// </summary>
    public InsuranceExpiryCheckService(
        IServiceScopeFactory scopeFactory,
        ILogger<InsuranceExpiryCheckService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _checkInterval = TimeSpan.FromHours(24);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "InsuranceExpiryCheckService started. Checking for expiring/expired policies every {Interval}",
            _checkInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessInsuranceExpiriesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing insurance expiry checks");
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

        _logger.LogInformation("InsuranceExpiryCheckService stopped");
    }

    /// <summary>
    /// Processes insurance records: transitions Active policies within 30 days of expiry to ExpiringSoon,
    /// and transitions ExpiringSoon policies past expiry to Expired.
    /// </summary>
    private async Task ProcessInsuranceExpiriesAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BuildEstateDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IPublisher>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var utcNow = DateTime.UtcNow;
        var expiryThreshold = utcNow.AddDays(ExpiryWarningDays);

        // Step 1: Transition Active → ExpiringSoon (within 30 days of expiry)
        await TransitionActiveToExpiringSoonAsync(
            dbContext, publisher, notificationService, utcNow, expiryThreshold, cancellationToken);

        // Step 2: Transition ExpiringSoon → Expired (past expiry date)
        await TransitionExpiringSoonToExpiredAsync(
            dbContext, publisher, notificationService, utcNow, cancellationToken);
    }

    /// <summary>
    /// Finds Active insurance records where ExpiryDate is within 30 days and transitions them to ExpiringSoon.
    /// </summary>
    private async Task TransitionActiveToExpiringSoonAsync(
        BuildEstateDbContext dbContext,
        IPublisher publisher,
        INotificationService notificationService,
        DateTime utcNow,
        DateTime expiryThreshold,
        CancellationToken cancellationToken)
    {
        var expiringSoonRecords = await dbContext.InsuranceRecords
            .Where(r => r.Status == InsuranceStatus.Active
                        && r.ExpiryDate <= expiryThreshold
                        && r.ExpiryDate > utcNow)
            .ToListAsync(cancellationToken);

        if (expiringSoonRecords.Count == 0)
        {
            _logger.LogDebug("No Active insurance records approaching expiry within {Days} days", ExpiryWarningDays);
            return;
        }

        _logger.LogInformation(
            "Found {Count} Active insurance record(s) expiring within {Days} days — transitioning to ExpiringSoon",
            expiringSoonRecords.Count, ExpiryWarningDays);

        foreach (var record in expiringSoonRecords)
        {
            record.Status = InsuranceStatus.ExpiringSoon;
            record.UpdatedAt = utcNow;
            record.UpdatedBy = SystemUserId;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Transitioned {Count} insurance record(s) from Active to ExpiringSoon",
            expiringSoonRecords.Count);

        // Publish events and send notifications for each transition
        foreach (var record in expiringSoonRecords)
        {
            try
            {
                await publisher.Publish(
                    new InsuranceExpiringEvent
                    {
                        InsuranceRecordId = record.Id,
                        PolicyNumber = record.PolicyNumber,
                        ExpiryDate = record.ExpiryDate,
                        InsuranceStatus = InsuranceStatus.ExpiringSoon,
                        Timestamp = utcNow
                    },
                    cancellationToken);

                await notificationService.SendToRoleAsync(
                    "Legal_Compliance_Officer",
                    "InsuranceExpiringSoon",
                    $"Insurance policy {record.PolicyNumber} ({record.Insurer}) is expiring on {record.ExpiryDate:yyyy-MM-dd}. Please arrange renewal.",
                    record.Id,
                    cancellationToken);

                _logger.LogInformation(
                    "Published InsuranceExpiringEvent for policy {PolicyNumber} (Id: {InsuranceRecordId}), expiry: {ExpiryDate:O}",
                    record.PolicyNumber, record.Id, record.ExpiryDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to publish event/notification for insurance record {InsuranceRecordId} ({PolicyNumber})",
                    record.Id, record.PolicyNumber);
            }
        }
    }

    /// <summary>
    /// Finds ExpiringSoon insurance records where ExpiryDate has passed and transitions them to Expired.
    /// </summary>
    private async Task TransitionExpiringSoonToExpiredAsync(
        BuildEstateDbContext dbContext,
        IPublisher publisher,
        INotificationService notificationService,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var expiredRecords = await dbContext.InsuranceRecords
            .Where(r => r.Status == InsuranceStatus.ExpiringSoon
                        && r.ExpiryDate < utcNow)
            .ToListAsync(cancellationToken);

        if (expiredRecords.Count == 0)
        {
            _logger.LogDebug("No ExpiringSoon insurance records have passed their expiry date");
            return;
        }

        _logger.LogInformation(
            "Found {Count} ExpiringSoon insurance record(s) past expiry — transitioning to Expired",
            expiredRecords.Count);

        foreach (var record in expiredRecords)
        {
            record.Status = InsuranceStatus.Expired;
            record.UpdatedAt = utcNow;
            record.UpdatedBy = SystemUserId;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Transitioned {Count} insurance record(s) from ExpiringSoon to Expired",
            expiredRecords.Count);

        // Publish events and send notifications for each transition
        foreach (var record in expiredRecords)
        {
            try
            {
                await publisher.Publish(
                    new InsuranceExpiringEvent
                    {
                        InsuranceRecordId = record.Id,
                        PolicyNumber = record.PolicyNumber,
                        ExpiryDate = record.ExpiryDate,
                        InsuranceStatus = InsuranceStatus.Expired,
                        Timestamp = utcNow
                    },
                    cancellationToken);

                await notificationService.SendToRoleAsync(
                    "Legal_Compliance_Officer",
                    "InsuranceExpired",
                    $"Insurance policy {record.PolicyNumber} ({record.Insurer}) has expired on {record.ExpiryDate:yyyy-MM-dd}. Immediate action required.",
                    record.Id,
                    cancellationToken);

                await notificationService.SendToRoleAsync(
                    "Finance_Director",
                    "InsuranceExpired",
                    $"Insurance policy {record.PolicyNumber} ({record.Insurer}) has expired on {record.ExpiryDate:yyyy-MM-dd}. Coverage gap exists.",
                    record.Id,
                    cancellationToken);

                _logger.LogInformation(
                    "Published InsuranceExpiringEvent (Expired) for policy {PolicyNumber} (Id: {InsuranceRecordId}), expiry: {ExpiryDate:O}",
                    record.PolicyNumber, record.Id, record.ExpiryDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to publish event/notification for expired insurance record {InsuranceRecordId} ({PolicyNumber})",
                    record.Id, record.PolicyNumber);
            }
        }
    }
}
