namespace BuildEstate.Domain.Entities.UserManagement;

/// <summary>
/// Represents an active or historical user session.
/// Sessions track device info, location, and revocation status for security management.
/// </summary>
public class UserSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Raw user-agent string or parsed device identifier.
    /// </summary>
    public string DeviceInfo { get; set; } = string.Empty;

    /// <summary>
    /// Parsed browser name (e.g., "Chrome 125").
    /// </summary>
    public string Browser { get; set; } = string.Empty;

    /// <summary>
    /// Parsed operating system (e.g., "Windows 11").
    /// </summary>
    public string OperatingSystem { get; set; } = string.Empty;

    /// <summary>
    /// Client IP address at session creation.
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>
    /// Geo-located city (optional, from IP).
    /// </summary>
    public string? City { get; set; }

    /// <summary>
    /// Geo-located country (optional, from IP).
    /// </summary>
    public string? Country { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Updated on each API request to track session activity.
    /// </summary>
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Absolute session expiration time.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Indicates whether this session has been revoked (e.g., by admin, password change, or deactivation).
    /// </summary>
    public bool IsRevoked { get; set; }

    /// <summary>
    /// Reason for revocation (e.g., "Account deactivated", "Password changed", "Admin revoked").
    /// </summary>
    public string? RevokedReason { get; set; }

    /// <summary>
    /// Timestamp when the session was revoked.
    /// </summary>
    public DateTime? RevokedAt { get; set; }
}
