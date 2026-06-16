namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides token management capabilities for the Application layer.
/// Supports JWT access token generation (via user identity parameters),
/// refresh token rotation with 30-second grace period, and token revocation.
///
/// Token specifications:
/// - Access token: 60-minute expiry with sub, email, and role claims
/// - Refresh token: 7-day default or 30-day "Remember me" expiry
/// - Grace period: 30 seconds after rotation (allows in-flight requests)
/// - Rotation: Old token marked as used; reuse beyond grace triggers full revocation
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generates a new JWT access token (60-minute expiry) and refresh token pair for the given user.
    /// The access token contains claims: sub (user ID), email, full_name, and role (one per role).
    /// The refresh token is cryptographically secure, stored in the database, and has either
    /// a 7-day (default) or 30-day ("Remember me") expiry.
    /// </summary>
    /// <param name="userId">The authenticated user's unique identifier.</param>
    /// <param name="email">The user's email address (included as a JWT claim).</param>
    /// <param name="firstName">The user's first name (combined with last name for full_name claim).</param>
    /// <param name="lastName">The user's last name.</param>
    /// <param name="roles">The user's assigned role names (each becomes a role claim).</param>
    /// <param name="rememberMe">If true, refresh token expiry is 30 days; otherwise 7 days.</param>
    /// <param name="deviceInfo">Optional device information (user-agent) for security tracking.</param>
    /// <param name="ipAddress">Optional client IP address for security tracking.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A tuple containing the access token and refresh token strings.</returns>
    Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        string userId, string email, string firstName, string lastName,
        IList<string> roles, bool rememberMe = false,
        string? deviceInfo = null, string? ipAddress = null, CancellationToken ct = default);

    /// <summary>
    /// Validates and rotates a refresh token, issuing a new access/refresh token pair.
    /// Implements a 30-second grace period where the old token remains valid after first use.
    /// Detects token reuse beyond the grace period as potential theft and revokes all user tokens.
    /// </summary>
    /// <param name="refreshToken">The current refresh token value.</param>
    /// <param name="ipAddress">Client IP address for the new token (security tracking).</param>
    /// <param name="deviceInfo">Device/user-agent information for the new token (security tracking).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A tuple containing the new access token and new refresh token strings.</returns>
    Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(
        string refreshToken, string ipAddress, string deviceInfo, CancellationToken ct = default);

    /// <summary>
    /// Revokes all active (non-used, non-revoked) refresh tokens for a given user.
    /// Used during security-critical events like deactivation, password change, or role change.
    /// </summary>
    /// <param name="userId">The user's identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    Task RevokeAllUserTokensAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Revokes a specific refresh token by its unique identifier.
    /// This operation is idempotent — revoking an already-revoked or non-existent token does not throw.
    /// </summary>
    /// <param name="tokenId">The refresh token's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    Task RevokeTokenAsync(Guid tokenId, CancellationToken ct = default);

    /// <summary>
    /// Revokes a specific refresh token by its token value string.
    /// Used during logout to invalidate only the current session's refresh token.
    /// This operation is idempotent — revoking an already-revoked or non-existent token does not throw.
    /// </summary>
    /// <param name="refreshToken">The refresh token value to revoke.</param>
    /// <param name="ct">Cancellation token.</param>
    Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default);
}
