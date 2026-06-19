namespace BuildEstate.Application.Common.Interfaces;

public interface INotificationEngine
{
    Task EmitAsync(NotificationEvent notificationEvent, CancellationToken cancellationToken = default);
}

public sealed record NotificationEvent
{
    public string EventType { get; init; } = string.Empty;
    public string Module { get; init; } = string.Empty;
    public Guid? EntityId { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public string RelatedUrl { get; init; } = string.Empty;
    public Dictionary<string, string> Variables { get; init; } = new();
    public string? TriggeredByUserId { get; init; }
}
