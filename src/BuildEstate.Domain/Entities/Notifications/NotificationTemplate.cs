using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.Notifications;

public class NotificationTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public string IconName { get; set; } = "notifications";
    public NotificationSeverity Severity { get; set; } = NotificationSeverity.Info;
    public string Variables { get; set; } = "[]"; // JSON array of available variable names
    public bool IsActive { get; set; } = true;
}
