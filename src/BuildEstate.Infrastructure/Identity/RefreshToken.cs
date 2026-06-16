using System.ComponentModel.DataAnnotations;

namespace BuildEstate.Infrastructure.Identity;

/// <summary>
/// Represents a refresh token issued during authentication.
/// Supports token rotation with single-use semantics and revocation.
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// The secure random token value used for refresh.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Absolute expiration time (7 days default, 30 days for "Remember me").
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Set to true after this token has been exchanged for a new token pair.
    /// Prevents replay attacks.
    /// </summary>
    public bool IsUsed { get; set; } = false;

    /// <summary>
    /// Timestamp when this token was consumed (used for rotation).
    /// Used to calculate the 30-second grace period during which the old token remains valid.
    /// </summary>
    public DateTime? UsedAt { get; set; }

    /// <summary>
    /// Set to true when the token is explicitly revoked (e.g., logout, admin action).
    /// </summary>
    public bool IsRevoked { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Device information captured at token issuance for security tracking.
    /// </summary>
    [MaxLength(512)]
    public string DeviceInfo { get; set; } = string.Empty;

    /// <summary>
    /// Client IP address captured at token issuance.
    /// </summary>
    [MaxLength(45)]
    public string IpAddress { get; set; } = string.Empty;

    // Navigation property
    public ApplicationUser User { get; set; } = null!;
}
