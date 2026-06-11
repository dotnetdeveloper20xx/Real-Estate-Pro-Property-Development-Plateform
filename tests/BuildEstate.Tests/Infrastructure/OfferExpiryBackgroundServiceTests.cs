using BuildEstate.Application.Features.LandAcquisition.EventHandlers;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services.BackgroundServices;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

/// <summary>
/// Unit tests for OfferExpiryBackgroundService verifying that expired offers
/// are correctly identified, status-updated, and notifications dispatched.
/// Validates: Requirements 7.4, 19.2
/// </summary>
public class OfferExpiryBackgroundServiceTests
{
    private readonly Mock<IPublisher> _publisherMock;
    private readonly Mock<ILogger<OfferExpiryBackgroundService>> _loggerMock;

    public OfferExpiryBackgroundServiceTests()
    {
        _publisherMock = new Mock<IPublisher>();
        _loggerMock = new Mock<ILogger<OfferExpiryBackgroundService>>();
    }

    private (BuildEstateDbContext seedContext, IServiceScopeFactory scopeFactory, DbContextOptions<BuildEstateDbContext> options) CreateTestServices()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var seedContext = new BuildEstateDbContext(options);

        var publisherMock = _publisherMock;
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddScoped(_ => new BuildEstateDbContext(options));
        serviceCollection.AddScoped<IPublisher>(_ => publisherMock.Object);

        var serviceProvider = serviceCollection.BuildServiceProvider();
        var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

        return (seedContext, scopeFactory, options);
    }

    [Fact]
    public async Task ProcessExpiredOffers_WithExpiredUnderReviewOffer_MarksAsExpired()
    {
        // Arrange
        var (seedContext, scopeFactory, options) = CreateTestServices();

        var opportunity = new LandOpportunity
        {
            Id = Guid.NewGuid(),
            Name = "Test Land",
            Location = "London",
            LandSize = 5.0m,
            Status = OpportunityStatus.OfferMade,
            CreatedBy = "user1"
        };

        var expiredOffer = new Offer
        {
            Id = Guid.NewGuid(),
            OpportunityId = opportunity.Id,
            Amount = 500000m,
            Currency = "GBP",
            OfferDate = DateTime.UtcNow.AddDays(-10),
            ValidUntil = DateTime.UtcNow.AddDays(-1), // expired yesterday
            Status = OfferStatus.UnderReview,
            CreatedBy = "acquisition_manager_1"
        };

        seedContext.LandOpportunities.Add(opportunity);
        seedContext.Offers.Add(expiredOffer);
        await seedContext.SaveChangesAsync();

        var service = new OfferExpiryBackgroundService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await service.StartAsync(cts.Token);
        await Task.Delay(1000);
        await service.StopAsync(CancellationToken.None);

        // Assert — read from a fresh context to see committed changes
        await using var verifyContext = new BuildEstateDbContext(options);
        var updatedOffer = await verifyContext.Offers
            .FirstOrDefaultAsync(o => o.Id == expiredOffer.Id);

        updatedOffer.Should().NotBeNull();
        updatedOffer!.Status.Should().Be(OfferStatus.Expired);
        updatedOffer.UpdatedBy.Should().Be("System:OfferExpiryService");
    }

    [Fact]
    public async Task ProcessExpiredOffers_WithExpiredOffer_PublishesOfferExpiredNotification()
    {
        // Arrange
        var (seedContext, scopeFactory, options) = CreateTestServices();

        var opportunity = new LandOpportunity
        {
            Id = Guid.NewGuid(),
            Name = "Test Land 2",
            Location = "Manchester",
            LandSize = 3.0m,
            Status = OpportunityStatus.OfferMade,
            CreatedBy = "user2"
        };

        var expiredOffer = new Offer
        {
            Id = Guid.NewGuid(),
            OpportunityId = opportunity.Id,
            Amount = 300000m,
            Currency = "GBP",
            OfferDate = DateTime.UtcNow.AddDays(-5),
            ValidUntil = DateTime.UtcNow.AddHours(-1), // expired 1 hour ago
            Status = OfferStatus.UnderReview,
            CreatedBy = "acq_manager_2"
        };

        seedContext.LandOpportunities.Add(opportunity);
        seedContext.Offers.Add(expiredOffer);
        await seedContext.SaveChangesAsync();

        var service = new OfferExpiryBackgroundService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await service.StartAsync(cts.Token);
        await Task.Delay(1000);
        await service.StopAsync(CancellationToken.None);

        // Assert — verify the notification was published
        _publisherMock.Verify(
            p => p.Publish(
                It.Is<OfferExpiredNotification>(n =>
                    n.OfferId == expiredOffer.Id &&
                    n.OpportunityId == opportunity.Id &&
                    n.CreatedBy == "acq_manager_2"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessExpiredOffers_WithValidUnderReviewOffer_DoesNotExpire()
    {
        // Arrange
        var (seedContext, scopeFactory, options) = CreateTestServices();

        var opportunity = new LandOpportunity
        {
            Id = Guid.NewGuid(),
            Name = "Active Land",
            Location = "Birmingham",
            LandSize = 7.0m,
            Status = OpportunityStatus.OfferMade,
            CreatedBy = "user3"
        };

        var validOffer = new Offer
        {
            Id = Guid.NewGuid(),
            OpportunityId = opportunity.Id,
            Amount = 400000m,
            Currency = "GBP",
            OfferDate = DateTime.UtcNow.AddDays(-1),
            ValidUntil = DateTime.UtcNow.AddDays(7), // still valid
            Status = OfferStatus.UnderReview,
            CreatedBy = "acq_manager_3"
        };

        seedContext.LandOpportunities.Add(opportunity);
        seedContext.Offers.Add(validOffer);
        await seedContext.SaveChangesAsync();

        var service = new OfferExpiryBackgroundService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await service.StartAsync(cts.Token);
        await Task.Delay(1000);
        await service.StopAsync(CancellationToken.None);

        // Assert — offer should remain UnderReview
        await using var verifyContext = new BuildEstateDbContext(options);
        var unchangedOffer = await verifyContext.Offers
            .FirstOrDefaultAsync(o => o.Id == validOffer.Id);

        unchangedOffer.Should().NotBeNull();
        unchangedOffer!.Status.Should().Be(OfferStatus.UnderReview);

        // No notification should be published
        _publisherMock.Verify(
            p => p.Publish(It.IsAny<OfferExpiredNotification>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessExpiredOffers_WithAcceptedOffer_DoesNotExpire()
    {
        // Arrange
        var (seedContext, scopeFactory, options) = CreateTestServices();

        var opportunity = new LandOpportunity
        {
            Id = Guid.NewGuid(),
            Name = "Accepted Land",
            Location = "Leeds",
            LandSize = 4.0m,
            Status = OpportunityStatus.UnderContract,
            CreatedBy = "user4"
        };

        var acceptedOffer = new Offer
        {
            Id = Guid.NewGuid(),
            OpportunityId = opportunity.Id,
            Amount = 600000m,
            Currency = "GBP",
            OfferDate = DateTime.UtcNow.AddDays(-20),
            ValidUntil = DateTime.UtcNow.AddDays(-5), // past ValidUntil, but already accepted
            Status = OfferStatus.Accepted,
            CreatedBy = "acq_manager_4"
        };

        seedContext.LandOpportunities.Add(opportunity);
        seedContext.Offers.Add(acceptedOffer);
        await seedContext.SaveChangesAsync();

        var service = new OfferExpiryBackgroundService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await service.StartAsync(cts.Token);
        await Task.Delay(1000);
        await service.StopAsync(CancellationToken.None);

        // Assert — offer should remain Accepted (only UnderReview offers expire)
        await using var verifyContext = new BuildEstateDbContext(options);
        var unchangedOffer = await verifyContext.Offers
            .FirstOrDefaultAsync(o => o.Id == acceptedOffer.Id);

        unchangedOffer.Should().NotBeNull();
        unchangedOffer!.Status.Should().Be(OfferStatus.Accepted);

        _publisherMock.Verify(
            p => p.Publish(It.IsAny<OfferExpiredNotification>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
