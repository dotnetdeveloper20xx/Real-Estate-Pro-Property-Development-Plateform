using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly BuildEstateDbContext _dbContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(BuildEstateDbContext dbContext, ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SendAsync(
        string recipientUserId,
        string eventType,
        string message,
        Guid? relatedEntityId,
        CancellationToken ct)
    {
        var notification = new Notification
        {
            RecipientUserId = recipientUserId,
            EventType = eventType,
            Message = message,
            RelatedEntityId = relatedEntityId,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _dbContext.Set<Notification>().Add(notification);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Notification sent to user {RecipientUserId}: [{EventType}] {Message}",
            recipientUserId, eventType, message);
    }

    public async Task SendToRoleAsync(
        string roleName,
        string eventType,
        string message,
        Guid? relatedEntityId,
        CancellationToken ct)
    {
        _logger.LogWarning(
            "SendToRoleAsync: Role resolution is not yet implemented. " +
            "Creating placeholder notification with role name '{RoleName}' as recipient.",
            roleName);

        var notification = new Notification
        {
            RecipientUserId = roleName,
            EventType = eventType,
            Message = message,
            RelatedEntityId = relatedEntityId,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _dbContext.Set<Notification>().Add(notification);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Notification sent to role {RoleName}: [{EventType}] {Message}",
            roleName, eventType, message);
    }
}
