using System.Security.Claims;

namespace BuildEstate.API.Middleware;

/// <summary>
/// Middleware that validates CSRF tokens on state-changing requests (POST, PUT, PATCH, DELETE).
/// Expects a X-CSRF-TOKEN header whose value matches the token stored in the user's session/cookie.
/// For API-only usage, we use a double-submit cookie pattern:
/// - A CSRF token is provided via the X-CSRF-TOKEN response header on authenticated GET requests.
/// - Clients must echo this token back as the X-CSRF-TOKEN request header on state-changing requests.
/// 
/// Requests to auth endpoints (login, refresh) are exempt since they don't yet have a session.
/// Anonymous requests (no authenticated user) are also exempt.
/// </summary>
public class CsrfValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CsrfValidationMiddleware> _logger;

    private static readonly HashSet<string> StateChangingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    private static readonly string[] ExemptPaths =
    [
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/health"
    ];

    public const string CsrfHeaderName = "X-CSRF-TOKEN";
    public const string CsrfCookieName = ".BuildEstate.Csrf";

    public CsrfValidationMiddleware(RequestDelegate next, ILogger<CsrfValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;

        // Only validate CSRF on state-changing methods
        if (StateChangingMethods.Contains(method))
        {
            var path = context.Request.Path.Value ?? string.Empty;

            // Exempt auth endpoints and health check
            var isExempt = ExemptPaths.Any(exempt =>
                path.StartsWith(exempt, StringComparison.OrdinalIgnoreCase));

            if (!isExempt)
            {
                // Only enforce on authenticated requests
                var isAuthenticated = context.User.Identity?.IsAuthenticated ?? false;
                if (isAuthenticated)
                {
                    var headerToken = context.Request.Headers[CsrfHeaderName].FirstOrDefault();
                    var cookieToken = context.Request.Cookies[CsrfCookieName];

                    if (string.IsNullOrEmpty(headerToken) || string.IsNullOrEmpty(cookieToken))
                    {
                        _logger.LogWarning(
                            "CSRF validation failed — missing token. Method={Method}, Path={Path}, User={UserId}",
                            method, path, context.User.FindFirstValue(ClaimTypes.NameIdentifier));

                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "CSRF token is missing." });
                        return;
                    }

                    if (!string.Equals(headerToken, cookieToken, StringComparison.Ordinal))
                    {
                        _logger.LogWarning(
                            "CSRF validation failed — token mismatch. Method={Method}, Path={Path}, User={UserId}",
                            method, path, context.User.FindFirstValue(ClaimTypes.NameIdentifier));

                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "CSRF token is invalid." });
                        return;
                    }
                }
            }
        }

        // For GET requests from authenticated users, issue/refresh CSRF token
        if (string.Equals(method, "GET", StringComparison.OrdinalIgnoreCase))
        {
            var isAuthenticated = context.User.Identity?.IsAuthenticated ?? false;
            if (isAuthenticated)
            {
                var existingCookie = context.Request.Cookies[CsrfCookieName];
                var token = existingCookie ?? GenerateToken();

                if (existingCookie is null)
                {
                    context.Response.Cookies.Append(CsrfCookieName, token, new CookieOptions
                    {
                        HttpOnly = false, // Must be readable by JavaScript
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Path = "/",
                        MaxAge = TimeSpan.FromHours(24)
                    });
                }

                // Include in response header so frontend can read it
                context.Response.Headers.Append(CsrfHeaderName, token);
            }
        }

        await _next(context);
    }

    private static string GenerateToken()
    {
        var bytes = new byte[32];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }
}

/// <summary>
/// Extension method to register the CSRF validation middleware.
/// </summary>
public static class CsrfValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseCsrfValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CsrfValidationMiddleware>();
    }
}
