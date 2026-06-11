using System.ComponentModel.DataAnnotations;

namespace BuildEstate.Infrastructure.Persistence.Entities;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(256)]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(256)]
    public string UserName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(256)]
    public string EntityName { get; set; } = string.Empty;

    [MaxLength(256)]
    public string EntityId { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? OldValues { get; set; }

    [MaxLength(4000)]
    public string? NewValues { get; set; }

    [MaxLength(2000)]
    public string? AffectedColumns { get; set; }

    public DateTime Timestamp { get; set; }

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [MaxLength(128)]
    public string? CorrelationId { get; set; }
}
