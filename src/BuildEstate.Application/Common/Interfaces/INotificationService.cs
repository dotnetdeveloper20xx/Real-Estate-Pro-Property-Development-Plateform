namespace BuildEstate.Application.Common.Interfaces;

/// <summary>
/// Provides notification capabilities for sending messages to individual users or role groups.
/// Implementations persist notifications and may dispatch real-time or email alerts.
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Sends a notification to a specific user.
    /// </summary>
    /// <param name="recipientUserId">The unique identifier of the recipient user.</param>
    /// <param name="eventType">The type of event that triggered the notification (e.g., OfferExpired, DueDiligenceFailed).</param>
    /// <param name="message">The human-readable notification message.</param>
    /// <param name="relatedEntityId">Optional identifier of the entity related to this notification.</param>
    /// <param name="ct">Cancellation token for async operation.</param>
    Task SendAsync(string recipientUserId, string eventType, string message, Guid? relatedEntityId, CancellationToken ct);

    /// <summary>
    /// Sends a notification to all users belonging to a specific role.
    /// </summary>
    /// <param name="roleName">The name of the role whose members should receive the notification.</param>
    /// <param name="eventType">The type of event that triggered the notification (e.g., OpportunityAcquired, ApprovalCreated).</param>
    /// <param name="message">The human-readable notification message.</param>
    /// <param name="relatedEntityId">Optional identifier of the entity related to this notification.</param>
    /// <param name="ct">Cancellation token for async operation.</param>
    Task SendToRoleAsync(string roleName, string eventType, string message, Guid? relatedEntityId, CancellationToken ct);
}
