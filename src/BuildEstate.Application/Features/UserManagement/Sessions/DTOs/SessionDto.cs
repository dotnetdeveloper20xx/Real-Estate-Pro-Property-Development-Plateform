namespace BuildEstate.Application.Features.UserManagement.Sessions.DTOs;

/// <summary>
/// Represents a user session for display in the session management UI.
/// </summary>
public sealed record SessionDto
{
    /// <summary>Unique session identifier.</summary>
    public Guid Id { get; init; }

    /// <summary>Raw device info (user-agent string).</summary>
    public string DeviceInfo { get; init; } = string.Empty;

    /// <summary>Parsed browser name (e.g., "Chrome", "Firefox").</summary>
    public string Browser { get; init; } = string.Empty;

    /// <summary>Parsed operating system (e.g., "Windows 10", "macOS").</summary>
    public string OperatingSystem { get; init; } = string.Empty;

    /// <summary>Client IP address.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Geolocation city (may be null).</summary>
    public string? City { get; init; }

    /// <summary>Geolocation country (may be null).</summary>
    public string? Country { get; init; }

    /// <summary>When the session was last active.</summary>
    public DateTime LastActiveAt { get; init; }

    /// <summary>Session status: "Current", "Active", or "Expired".</summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>Whether this is the current user's session (cannot be revoked).</summary>
    public bool IsCurrent { get; init; }
}
