namespace BuildEstate.Application.Features.LegalCompliance.AuditTrail.DTOs;

/// <summary>
/// DTO representing a single audit log entry for CSV export.
/// Contains the same fields as AuditHistoryDto for compliance review exports.
/// </summary>
public sealed record AuditExportDto
{
    /// <summary>Unique identifier of the audit log entry.</summary>
    public Guid Id { get; init; }

    /// <summary>Identifier of the user who performed the action.</summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>Display name of the user who performed the action.</summary>
    public string UserName { get; init; } = string.Empty;

    /// <summary>The action performed (Create, Update, Delete).</summary>
    public string Action { get; init; } = string.Empty;

    /// <summary>The entity type name (e.g., LegalCase, Contract).</summary>
    public string EntityName { get; init; } = string.Empty;

    /// <summary>The identifier of the affected entity.</summary>
    public string EntityId { get; init; } = string.Empty;

    /// <summary>JSON representation of old values before the change.</summary>
    public string? OldValues { get; init; }

    /// <summary>JSON representation of new values after the change.</summary>
    public string? NewValues { get; init; }

    /// <summary>Comma-separated list of columns affected by the change.</summary>
    public string? AffectedColumns { get; init; }

    /// <summary>UTC timestamp when the action was recorded.</summary>
    public DateTime Timestamp { get; init; }

    /// <summary>IP address from which the request originated.</summary>
    public string? IpAddress { get; init; }

    /// <summary>Correlation ID linking this entry to the originating HTTP request.</summary>
    public string? CorrelationId { get; init; }
}
