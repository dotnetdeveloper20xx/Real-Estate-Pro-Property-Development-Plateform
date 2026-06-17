using System.Security.Claims;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers;

/// <summary>
/// Handles authentication operations including login, token refresh, logout,
/// current user profile, and password changes.
/// Does NOT inherit BaseApiController to avoid class-level [Authorize].
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IInfrastructureTokenService _tokenService;
    private readonly ISessionService _sessionService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IInfrastructureTokenService tokenService,
        ISessionService sessionService,
        IAuditLogService auditLogService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _sessionService = sessionService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// Authenticates a user with email and password, returning JWT tokens and user profile.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            _logger.LogWarning("Login failed — user not found for email {Email}", request.Email);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed — user {UserId} is deactivated", user.Id);
            return Unauthorized(new { message = "Account is deactivated. Contact your administrator." });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
            {
                _logger.LogWarning("Login failed — user {UserId} is locked out", user.Id);
                return Unauthorized(new { message = "Account is locked. Please try again later." });
            }

            _logger.LogWarning("Login failed — invalid password for user {UserId}", user.Id);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var deviceInfo = Request.Headers.UserAgent.ToString();
        var (accessToken, refreshToken) = await _tokenService.GenerateTokensAsync(
            user, roles, request.RememberMe, deviceInfo, ipAddress);

        // Create session record so SessionValidationMiddleware won't reject subsequent requests
        await _sessionService.CreateSessionAsync(user.Id, ipAddress, deviceInfo);

        _logger.LogInformation("User {UserId} logged in successfully", user.Id);

        // Record audit log entry for successful login
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "UserLogin",
            PerformedByUserId = user.Id,
            PerformedByUserName = $"{user.FirstName} {user.LastName}",
            TargetEntityType = "User",
            TargetEntityId = user.Id,
            TargetUserName = $"{user.FirstName} {user.LastName}",
            IpAddress = ipAddress ?? "unknown",
            Details = $"User logged in from {deviceInfo}"
        });

        return Ok(new
        {
            accessToken,
            refreshToken,
            user = new
            {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                roles = roles
            }
        });
    }

    /// <summary>
    /// Exchanges a valid refresh token for a new access token and refresh token pair.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var deviceInfo = Request.Headers.UserAgent.ToString();

            var (accessToken, refreshToken) = await _tokenService.RefreshTokenAsync(
                request.RefreshToken, ipAddress, deviceInfo);

            return Ok(new { accessToken, refreshToken });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Token refresh failed: {Reason}", ex.Message);
            return Unauthorized(new { message = "Invalid or expired refresh token." });
        }
    }

    /// <summary>
    /// Revokes all refresh tokens for the current user, effectively logging them out.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await _tokenService.RevokeAllUserTokensAsync(userId);

        _logger.LogInformation("User {UserId} logged out — all tokens revoked", userId);

        return NoContent();
    }

    /// <summary>
    /// Returns the current authenticated user's profile information and roles.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            isActive = user.IsActive,
            roles = roles
        });
    }

    /// <summary>
    /// Changes the current user's password after verifying the current password.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            _logger.LogWarning("Password change failed for user {UserId}: {Errors}", userId, string.Join(", ", errors));
            return BadRequest(new { errors });
        }

        // Revoke all existing tokens after password change for security
        await _tokenService.RevokeAllUserTokensAsync(userId);

        _logger.LogInformation("User {UserId} changed password successfully", userId);

        return Ok(new { message = "Password changed successfully." });
    }
}

// ──────────────────────────────────────────────────────────────────
// Request DTOs
// ──────────────────────────────────────────────────────────────────

public sealed record LoginRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public bool RememberMe { get; init; } = false;
}

public sealed record RefreshRequest
{
    public string RefreshToken { get; init; } = string.Empty;
}

public sealed record ChangePasswordRequest
{
    public string CurrentPassword { get; init; } = string.Empty;
    public string NewPassword { get; init; } = string.Empty;
}
