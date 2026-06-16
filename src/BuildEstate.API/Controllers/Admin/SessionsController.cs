using System.Security.Claims;
using BuildEstate.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.Admin;

/// <summary>
/// Administrative session management endpoints for SuperAdmin role.
/// Provides session listing and revocation capabilities.
/// </summary>
[Route("api/v1/sessions")]
[Authorize(Roles = "SuperAdmin")]
public class SessionsController : BaseApiController
{
    private readonly ISessionService _sessionService;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(
        ISessionService sessionService,
        ILogger<SessionsController> logger)
    {
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Returns all active sessions for a specific user.
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserSessions(string userId, CancellationToken cancellationToken)
    {
        var sessions = await _sessionService.GetActiveSessionsAsync(userId, cancellationToken);

        var sessionDtos = sessions.Select(s => new
        {
            id = s.Id,
            deviceInfo = s.DeviceInfo,
            browser = s.Browser,
            operatingSystem = s.OperatingSystem,
            ipAddress = s.IpAddress,
            city = s.City,
            country = s.Country,
            lastActiveAt = s.LastActiveAt,
            createdAt = s.CreatedAt,
            isRevoked = s.IsRevoked
        });

        return Ok(sessionDtos);
    }

    /// <summary>
    /// Revokes a specific session by its ID.
    /// </summary>
    [HttpPost("{sessionId}/revoke")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RevokeSession(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";

        await _sessionService.RevokeSessionAsync(sessionId, $"Revoked by admin {adminId}", cancellationToken);

        _logger.LogInformation("Session {SessionId} revoked by admin {AdminId}", sessionId, adminId);

        return Ok(new { message = "Session revoked successfully." });
    }

    /// <summary>
    /// Revokes all active sessions for a specific user.
    /// </summary>
    [HttpPost("user/{userId}/revoke-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RevokeAllUserSessions(
        string userId,
        CancellationToken cancellationToken)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";

        await _sessionService.RevokeAllUserSessionsAsync(
            userId, $"All sessions revoked by admin {adminId}", cancellationToken);

        _logger.LogInformation("All sessions revoked for user {UserId} by admin {AdminId}", userId, adminId);

        return Ok(new { message = "All sessions revoked successfully." });
    }
}
