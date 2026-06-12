using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Entities.LegalCompliance;
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
/// Unit tests for ComplianceOverdueCheckService verifying that documents with
/// retention expiry within 30 days are identified and notifications sent.
/// Validates: Requirement 8.8
/// </summary>
public class ComplianceOverdueCheckServiceTests
{
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<IPublisher> _publisherMock;
    private readonly Mock<ILogger<ComplianceOverdueCheckService>> _loggerMock;

    public ComplianceOverdueCheckServiceTests()
    {
        _notificationServiceMock = new Mock<INotificationService>();
        _publisherMock = new Mock<IPublisher>();
        _loggerMock = new Mock<ILogger<ComplianceOverdueCheckService>>();
    }

    private (BuildEstateDbContext seedContext, IServiceScopeFactory scopeFactory, DbContextOptions<BuildEstateDbContext> options) CreateTestServices()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var seedContext = new BuildEstateDbContext(options);

        var notificationMock = _notificationServiceMock;
        var publisherMock = _publisherMock;
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddScoped(_ => new BuildEstateDbContext(options));
        serviceCollection.AddScoped<INotificationService>(_ => notificationMock.Object);
        serviceCollection.AddScoped<IPublisher>(_ => publisherMock.Object);

        var serviceProvider = serviceCollection.BuildServiceProvider();
        var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

        return (seedContext, scopeFactory, options);
    }

    [Fact]
    public async Task ProcessOverdueItems_WithDocumentExpiringWithin30Days_SendsNotification()
    {
        // Arrange
        var (seedContext, scopeFactory, _) = CreateTestServices();

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            DocumentType = LegalDocumentType.Contract,
            ConfidentialityLevel = ConfidentialityLevel.Internal,
            FileName = "TestContract.pdf",
            ContentType = "application/pdf",
            FileSize = 1024,
            StoragePath = "/documents/test.pdf",
            Version = 1,
            UploadedAt = DateTime.UtcNow.AddDays(-60),
            UploadedBy = "admin_user",
            RetentionExpiryDate = DateTime.UtcNow.AddDays(15), // within 30 days
            CreatedBy = "admin_user",
            IsDeleted = false
        };

        seedContext.LegalDocuments.Add(document);
        await seedContext.SaveChangesAsync();

        var service = new ComplianceOverdueCheckService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await service.StartAsync(cts.Token);
        await Task.Delay(2000);
        await service.StopAsync(CancellationToken.None);

        // Assert
        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync(
                "Legal_Compliance_Officer",
                "DocumentRetentionExpiring",
                It.Is<string>(msg => msg.Contains("TestContract.pdf") && msg.Contains("retention period")),
                document.Id,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessOverdueItems_WithDocumentExpiringBeyond30Days_DoesNotSendNotification()
    {
        // Arrange
        var (seedContext, scopeFactory, _) = CreateTestServices();

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            DocumentType = LegalDocumentType.TitleDeed,
            ConfidentialityLevel = ConfidentialityLevel.Confidential,
            FileName = "TitleDeed.pdf",
            ContentType = "application/pdf",
            FileSize = 2048,
            StoragePath = "/documents/title.pdf",
            Version = 1,
            UploadedAt = DateTime.UtcNow.AddDays(-30),
            UploadedBy = "legal_officer",
            RetentionExpiryDate = DateTime.UtcNow.AddDays(60), // beyond 30 days
            CreatedBy = "legal_officer",
            IsDeleted = false
        };

        seedContext.LegalDocuments.Add(document);
        await seedContext.SaveChangesAsync();

        var service = new ComplianceOverdueCheckService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await service.StartAsync(cts.Token);
        await Task.Delay(2000);
        await service.StopAsync(CancellationToken.None);

        // Assert — no retention expiry notification should be sent
        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync(
                "Legal_Compliance_Officer",
                "DocumentRetentionExpiring",
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessOverdueItems_WithDeletedDocumentExpiringWithin30Days_DoesNotSendNotification()
    {
        // Arrange
        var (seedContext, scopeFactory, _) = CreateTestServices();

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            DocumentType = LegalDocumentType.LegalOpinion,
            ConfidentialityLevel = ConfidentialityLevel.Restricted,
            FileName = "DeletedOpinion.pdf",
            ContentType = "application/pdf",
            FileSize = 512,
            StoragePath = "/documents/deleted.pdf",
            Version = 1,
            UploadedAt = DateTime.UtcNow.AddDays(-90),
            UploadedBy = "legal_officer",
            RetentionExpiryDate = DateTime.UtcNow.AddDays(10), // within 30 days
            CreatedBy = "legal_officer",
            IsDeleted = true, // soft deleted
            DeletedAt = DateTime.UtcNow.AddDays(-5),
            DeletedBy = "legal_officer"
        };

        seedContext.LegalDocuments.Add(document);
        await seedContext.SaveChangesAsync();

        var service = new ComplianceOverdueCheckService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await service.StartAsync(cts.Token);
        await Task.Delay(2000);
        await service.StopAsync(CancellationToken.None);

        // Assert — soft-deleted documents should not trigger notifications
        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync(
                "Legal_Compliance_Officer",
                "DocumentRetentionExpiring",
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessOverdueItems_WithDocumentAlreadyExpired_DoesNotSendNotification()
    {
        // Arrange
        var (seedContext, scopeFactory, _) = CreateTestServices();

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            DocumentType = LegalDocumentType.SearchReport,
            ConfidentialityLevel = ConfidentialityLevel.Internal,
            FileName = "ExpiredReport.pdf",
            ContentType = "application/pdf",
            FileSize = 4096,
            StoragePath = "/documents/expired.pdf",
            Version = 1,
            UploadedAt = DateTime.UtcNow.AddDays(-365),
            UploadedBy = "admin_user",
            RetentionExpiryDate = DateTime.UtcNow.AddDays(-5), // already expired
            CreatedBy = "admin_user",
            IsDeleted = false
        };

        seedContext.LegalDocuments.Add(document);
        await seedContext.SaveChangesAsync();

        var service = new ComplianceOverdueCheckService(scopeFactory, _loggerMock.Object);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await service.StartAsync(cts.Token);
        await Task.Delay(2000);
        await service.StopAsync(CancellationToken.None);

        // Assert — already-expired documents should not trigger the "approaching expiry" notification
        _notificationServiceMock.Verify(
            n => n.SendToRoleAsync(
                "Legal_Compliance_Officer",
                "DocumentRetentionExpiring",
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
