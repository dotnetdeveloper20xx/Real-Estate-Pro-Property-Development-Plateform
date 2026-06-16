namespace BuildEstate.Application.Features.UserManagement.Users.DTOs;

/// <summary>
/// Data transfer object representing a user session for display in the user detail view.
/// Contains device, location, and status information for session management.
/// </summary>
public sealed record UserSessionDto
{
    /// <summary>The unique session identifier.</summary>
    public Guid Id { get; init; }

    /// <summary>Raw device info or user-agent string.</summary>
    public string DeviceInfo { get; init; } = string.Empty;

    /// <summary>Parsed browser name (e.g., "Chrome 125").</summary>
    public string Browser { get; init; } = string.Empty;

    /// <summary>Parsed operating system (e.g., "Windows 11").</summary>
    public string OperatingSystem { get; init; } = string.Empty;

    /// <summary>Client IP address at session creation.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Geo-located city, or null if unavailable.</summary>
    public string? City { get; init; }

    /// <summary>Geo-located country, or null if unavailable.</summary>
    public string? Country { get; init; }

    /// <summary>Timestamp of the last API request made within this session.</summary>
    public DateTime LastActiveAt { get; init; }

    /// <summary>Whether this session has been revoked.</summary>
    public bool IsRevoked { get; init; }

    /// <summary>When the session was created.</summary>
    public DateTime CreatedAt { get; init; }
}
