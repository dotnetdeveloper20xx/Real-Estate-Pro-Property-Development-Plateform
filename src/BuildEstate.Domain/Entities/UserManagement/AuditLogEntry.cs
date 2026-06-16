namespace BuildEstate.Domain.Entities.UserManagement;

/// <summary>
/// Immutable audit log entry recording security-critical actions.
/// Once created, audit log entries cannot be modified or deleted.
/// </summary>
public class AuditLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// UTC timestamp of when the action occurred.
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The action performed (e.g., "UserLogin", "UserDeactivated", "RolePermissionChanged").
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// The user ID of who performed the action.
    /// </summary>
    public string PerformedByUserId { get; set; } = string.Empty;

    /// <summary>
    /// The display name of who performed the action (denormalized for query performance).
    /// </summary>
    public string PerformedByUserName { get; set; } = string.Empty;

    /// <summary>
    /// The type of entity affected (e.g., "User", "Role", "Permission").
    /// </summary>
    public string? TargetEntityType { get; set; }

    /// <summary>
    /// The ID of the affected entity.
    /// </summary>
    public string? TargetEntityId { get; set; }

    /// <summary>
    /// The display name of the target user (if the action targets a user).
    /// </summary>
    public string? TargetUserName { get; set; }

    /// <summary>
    /// Client IP address of the request that triggered the action.
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>
    /// JSON-serialized previous values of changed fields.
    /// </summary>
    public string? OldValues { get; set; }

    /// <summary>
    /// JSON-serialized new values of changed fields.
    /// </summary>
    public string? NewValues { get; set; }

    /// <summary>
    /// Comma-separated list of field names that were modified.
    /// </summary>
    public string? AffectedFields { get; set; }

    /// <summary>
    /// Request correlation ID for distributed tracing.
    /// </summary>
    public string CorrelationId { get; set; } = string.Empty;

    /// <summary>
    /// Additional context or notes about the action.
    /// </summary>
    public string? Details { get; set; }
}
