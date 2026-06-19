using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Entities.Notifications;

public class UserNotificationPreference : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public bool InAppEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    public DateTime? MutedUntil { get; set; }
}
