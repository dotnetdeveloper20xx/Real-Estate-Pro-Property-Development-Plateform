using System.Diagnostics;
using BuildEstate.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior that logs request entry, exit, elapsed time, performance warnings,
/// and errors with structured properties including CorrelationId and UserId.
/// </summary>
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private const int LongRunningThresholdMs = 500;

    public LoggingBehavior(
        ILogger<LoggingBehavior<TRequest, TResponse>> logger,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor)
    {
        _logger = logger;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var userId = _currentUserService.UserId ?? "Anonymous";
        var correlationId = GetCorrelationId();

        var stopwatch = Stopwatch.StartNew();

        using (_logger.BeginScope(new Dictionary<string, object?>
        {
            ["CorrelationId"] = correlationId,
            ["UserId"] = userId
        }))
        {
            _logger.LogInformation(
                "Handling {RequestName} for User {UserId} with CorrelationId {CorrelationId}",
                requestName, userId, correlationId);

            try
            {
                var response = await next();

                stopwatch.Stop();
                var elapsedMs = stopwatch.ElapsedMilliseconds;

                _logger.LogInformation(
                    "Handled {RequestName} in {ElapsedMilliseconds}ms",
                    requestName, elapsedMs);

                if (elapsedMs > LongRunningThresholdMs)
                {
                    _logger.LogWarning(
                        "Long-running request {RequestName} took {ElapsedMilliseconds}ms",
                        requestName, elapsedMs);
                }

                return response;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                var elapsedMs = stopwatch.ElapsedMilliseconds;

                _logger.LogError(
                    ex,
                    "Request {RequestName} failed after {ElapsedMilliseconds}ms",
                    requestName, elapsedMs);

                throw;
            }
        }
    }

    private string? GetCorrelationId()
    {
        if (_httpContextAccessor.HttpContext?.Items.TryGetValue("CorrelationId", out var correlationId) == true)
        {
            return correlationId?.ToString();
        }

        return null;
    }
}
