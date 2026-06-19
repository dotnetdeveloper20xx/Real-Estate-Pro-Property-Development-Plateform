using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class Notification : BaseEntity
{
    public string RecipientUserId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Icon { get; set; } = "notifications";
    public string Severity { get; set; } = "Info";
    public string Priority { get; set; } = "Normal";
    public Guid? RelatedEntityId { get; set; }
    public string RelatedEntityType { get; set; } = string.Empty;
    public string RelatedUrl { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public string Channel { get; set; } = "InApp";
    public string DeliveryStatus { get; set; } = "Delivered";
    public DateTime SentAt { get; set; }
}
