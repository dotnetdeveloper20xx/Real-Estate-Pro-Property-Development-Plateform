using BuildEstate.Domain.Entities.UserManagement;

namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Manages user sessions including creation with device info parsing,
/// retrieval of active sessions, and revocation (individual, per-user, and per-role).
/// Sessions track device, location, IP, and revocation metadata for security auditing.
/// </summary>
public interface ISessionService
{
    /// <summary>
    /// Creates a new session for the user, parsing browser and OS from the user-agent string,
    /// recording the IP address, and setting a 7-day expiration.
    /// Geolocation (city/country) is stored as null until an external API integration is added.
    /// </summary>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="ipAddress">The client's IP address.</param>
    /// <param name="userAgent">The raw User-Agent header value.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The created <see cref="UserSession"/> entity.</returns>
    Task<UserSession> CreateSessionAsync(
        string userId, string ipAddress, string userAgent, CancellationToken ct = default);

    /// <summary>
    /// Retrieves all active (non-revoked, non-expired) sessions for a given user,
    /// ordered by most recently active first.
    /// </summary>
    /// <param name="userId">The user's identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A read-only list of active sessions.</returns>
    Task<IReadOnlyList<UserSession>> GetActiveSessionsAsync(
        string userId, CancellationToken ct = default);

    /// <summary>
    /// Revokes a specific session by marking it as revoked with the provided reason and timestamp.
    /// </summary>
    /// <param name="sessionId">The unique session identifier.</param>
    /// <param name="reason">The reason for revocation (e.g., "Admin revoked", "Password changed").</param>
    /// <param name="ct">Cancellation token.</param>
    Task RevokeSessionAsync(
        Guid sessionId, string reason, CancellationToken ct = default);

    /// <summary>
    /// Revokes all active sessions for a given user.
    /// Used during security-critical events such as deactivation, password change, or role change.
    /// </summary>
    /// <param name="userId">The user's identifier.</param>
    /// <param name="reason">The reason for revocation.</param>
    /// <param name="ct">Cancellation token.</param>
    Task RevokeAllUserSessionsAsync(
        string userId, string reason, CancellationToken ct = default);

    /// <summary>
    /// Revokes all active sessions for every user assigned to the specified role.
    /// Used when role permissions are changed to enforce immediate session invalidation.
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="reason">The reason for revocation.</param>
    /// <param name="ct">Cancellation token.</param>
    Task RevokeSessionsForRoleAsync(
        string roleId, string reason, CancellationToken ct = default);
}
