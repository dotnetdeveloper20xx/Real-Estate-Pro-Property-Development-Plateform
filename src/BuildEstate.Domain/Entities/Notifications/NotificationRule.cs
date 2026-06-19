using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.Notifications;

public class NotificationRule : BaseEntity
{
    public string EventType { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RecipientType RecipientType { get; set; }
    public string RecipientValue { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; } = NotificationChannel.InApp;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public Guid? TemplateId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public NotificationTemplate? Template { get; set; }
}
