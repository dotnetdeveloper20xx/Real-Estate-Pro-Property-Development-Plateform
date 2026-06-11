namespace BuildEstate.API.Middleware;

/// <summary>
/// Middleware that adds security headers to every HTTP response.
/// Does not overwrite headers already set by other components.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly Dictionary<string, string> SecurityHeaders = new()
    {
        ["X-Content-Type-Options"] = "nosniff",
        ["X-Frame-Options"] = "DENY",
        ["X-XSS-Protection"] = "1; mode=block",
        ["Referrer-Policy"] = "strict-origin-when-cross-origin",
        ["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains",
        ["Content-Security-Policy"] = "default-src 'self'"
    };

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            foreach (var header in SecurityHeaders)
            {
                if (!headers.ContainsKey(header.Key))
                {
                    headers.Append(header.Key, header.Value);
                }
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}

/// <summary>
/// Extension method to register the SecurityHeadersMiddleware in the pipeline.
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}
