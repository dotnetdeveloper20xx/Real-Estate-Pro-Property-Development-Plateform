using System.Security.Claims;
using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace BuildEstate.API.Middleware;

/// <summary>
/// Middleware that validates the user's session is still active and the user is not deactivated.
/// On each authenticated request:
/// 1. Checks if the user is still active (not deactivated).
/// 2. Checks if the user's session has not been revoked.
/// If either check fails, returns 401 Unauthorized with a reason message.
/// 
/// Skips validation for:
/// - Unauthenticated requests (handled by auth middleware)
/// - Auth endpoints (login, refresh)
/// - DevAuth users (development only)
/// </summary>
public class SessionValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SessionValidationMiddleware> _logger;

    private static readonly string[] ExemptPaths =
    [
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/health"
    ];

    public SessionValidationMiddleware(RequestDelegate next, ILogger<SessionValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var isAuthenticated = context.User.Identity?.IsAuthenticated ?? false;
        if (!isAuthenticated)
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value ?? string.Empty;
        var isExempt = ExemptPaths.Any(exempt =>
            path.StartsWith(exempt, StringComparison.OrdinalIgnoreCase));

        if (isExempt)
        {
            await _next(context);
            return;
        }

        // Skip validation for dev auth users
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(userId, "dev-user-id", StringComparison.Ordinal))
        {
            await _next(context);
            return;
        }

        if (string.IsNullOrEmpty(userId))
        {
            await _next(context);
            return;
        }

        // Check if the user is still active
        var userManager = context.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByIdAsync(userId);

        if (user is null || !user.IsActive)
        {
            _logger.LogWarning(
                "Session validation failed — user {UserId} is deactivated or not found. Path={Path}",
                userId, path);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Your account has been deactivated. Please contact your administrator."
            });
            return;
        }

        // Check if sessions are revoked by looking at ISessionService
        var sessionService = context.RequestServices.GetRequiredService<ISessionService>();
        var activeSessions = await sessionService.GetActiveSessionsAsync(userId);

        if (activeSessions.Count == 0)
        {
            _logger.LogWarning(
                "Session validation failed — no active sessions for user {UserId}. Path={Path}",
                userId, path);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Your session has been revoked. Please log in again."
            });
            return;
        }

        await _next(context);
    }
}

/// <summary>
/// Extension method to register the session validation middleware.
/// </summary>
public static class SessionValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseSessionValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SessionValidationMiddleware>();
    }
}
