using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class Notification : BaseEntity
{
    public string RecipientUserId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedEntityId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; }
}
