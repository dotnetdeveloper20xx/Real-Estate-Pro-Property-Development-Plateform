using Microsoft.Extensions.Logging;

namespace BuildEstate.API.Middleware;

/// <summary>
/// Middleware that ensures every request has a correlation ID for end-to-end tracing.
/// If the incoming X-Correlation-ID header contains a valid GUID, it is used.
/// Otherwise, a new GUID is generated.
/// The correlation ID is added to the response header, logging scope, and HttpContext.Items.
/// </summary>
public class CorrelationIdMiddleware
{
    private const string CorrelationIdHeaderName = "X-Correlation-ID";
    private const string CorrelationIdItemKey = "CorrelationId";

    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = GetOrGenerateCorrelationId(context);

        // Store in HttpContext.Items for downstream components
        context.Items[CorrelationIdItemKey] = correlationId;

        // Add to response headers
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationIdHeaderName] = correlationId;
            return Task.CompletedTask;
        });

        // Add to logging scope so all log entries include the correlation ID
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            [CorrelationIdItemKey] = correlationId
        }))
        {
            await _next(context);
        }
    }

    private static string GetOrGenerateCorrelationId(HttpContext context)
    {
        var headerValue = context.Request.Headers[CorrelationIdHeaderName].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(headerValue) && Guid.TryParse(headerValue, out var parsedGuid))
        {
            return parsedGuid.ToString("D").ToLowerInvariant();
        }

        return Guid.NewGuid().ToString("D").ToLowerInvariant();
    }
}
