namespace BuildEstate.Application.Features.UserManagement.AuditLogs.DTOs;

/// <summary>
/// DTO representing a single audit log entry for the admin UI.
/// </summary>
public sealed record AuditLogEntryDto
{
    /// <summary>Unique audit entry identifier.</summary>
    public Guid Id { get; init; }

    /// <summary>UTC timestamp of when the action occurred.</summary>
    public DateTime Timestamp { get; init; }

    /// <summary>The action performed (e.g., "UserLogin", "UserDeactivated").</summary>
    public string Action { get; init; } = string.Empty;

    /// <summary>Display name of who performed the action.</summary>
    public string PerformedByUserName { get; init; } = string.Empty;

    /// <summary>Display name of the target user (if applicable).</summary>
    public string? TargetUserName { get; init; }

    /// <summary>Additional context about the action.</summary>
    public string? Details { get; init; }

    /// <summary>Client IP address of the request that triggered the action.</summary>
    public string IpAddress { get; init; } = string.Empty;
}
