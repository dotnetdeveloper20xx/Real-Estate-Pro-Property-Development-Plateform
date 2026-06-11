using BuildEstate.Application.Features.LandAcquisition.EventHandlers;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services.BackgroundServices;

/// <summary>
/// Background service that periodically checks for offers whose ValidUntil date has passed
/// while still in UnderReview status, marks them as Expired, and dispatches an
/// OfferExpiredNotification via MediatR to notify the Acquisition Manager.
/// 
/// Validates: Requirements 7.4, 19.2
/// </summary>
public sealed class OfferExpiryBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OfferExpiryBackgroundService> _logger;
    private readonly TimeSpan _checkInterval;

    /// <summary>
    /// Initializes the background service with a configurable check interval.
    /// Default interval is 1 hour.
    /// </summary>
    public OfferExpiryBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<OfferExpiryBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _checkInterval = TimeSpan.FromHours(1);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "OfferExpiryBackgroundService started. Checking for expired offers every {Interval}",
            _checkInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredOffersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Graceful shutdown — do not log as error
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing expired offers");
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

        _logger.LogInformation("OfferExpiryBackgroundService stopped");
    }

    /// <summary>
    /// Queries for offers that have passed their ValidUntil date while still UnderReview,
    /// updates their status to Expired, and publishes notifications.
    /// </summary>
    private async Task ProcessExpiredOffersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BuildEstateDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IPublisher>();

        var utcNow = DateTime.UtcNow;

        var expiredOffers = await dbContext.Offers
            .Where(o => o.Status == OfferStatus.UnderReview && o.ValidUntil < utcNow)
            .ToListAsync(cancellationToken);

        if (expiredOffers.Count == 0)
        {
            _logger.LogDebug("No expired offers found during this check cycle");
            return;
        }

        _logger.LogInformation(
            "Found {Count} expired offer(s) to process",
            expiredOffers.Count);

        foreach (var offer in expiredOffers)
        {
            offer.Status = OfferStatus.Expired;
            offer.UpdatedAt = utcNow;
            offer.UpdatedBy = "System:OfferExpiryService";
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated {Count} offer(s) to Expired status",
            expiredOffers.Count);

        // Publish notifications for each expired offer
        foreach (var offer in expiredOffers)
        {
            try
            {
                await publisher.Publish(
                    new OfferExpiredNotification
                    {
                        OpportunityId = offer.OpportunityId,
                        OfferId = offer.Id,
                        CreatedBy = offer.CreatedBy
                    },
                    cancellationToken);

                _logger.LogInformation(
                    "Published OfferExpiredNotification for Offer {OfferId} on Opportunity {OpportunityId}",
                    offer.Id, offer.OpportunityId);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to publish OfferExpiredNotification for Offer {OfferId}",
                    offer.Id);
            }
        }
    }
}
