using System.Net;
using System.Text.Json;
using BuildEstate.Shared;
using BuildEstate.Shared.Exceptions;
using FluentValidation;

namespace BuildEstate.API.Middleware;

/// <summary>
/// Middleware that catches all unhandled exceptions and maps them to structured
/// JSON ApiResponse error responses with appropriate HTTP status codes.
/// Never exposes stack traces or internal details to clients.
/// </summary>
public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Items.TryGetValue("CorrelationId", out var id)
            ? id?.ToString() ?? "unknown"
            : "unknown";

        var requestPath = context.Request.Path.ToString();
        var httpMethod = context.Request.Method;

        _logger.LogError(
            exception,
            "Unhandled exception occurred. CorrelationId: {CorrelationId}, Path: {RequestPath}, Method: {HttpMethod}",
            correlationId,
            requestPath,
            httpMethod);

        var (statusCode, errors) = MapException(exception);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.FailureResult(errors);

        var json = JsonSerializer.Serialize(response, JsonOptions);
        await context.Response.WriteAsync(json);
    }

    private static (HttpStatusCode StatusCode, List<string> Errors) MapException(Exception exception)
    {
        return exception switch
        {
            ValidationException validationException => (
                HttpStatusCode.BadRequest,
                validationException.Errors
                    .Select(failure => $"{failure.PropertyName}: {failure.ErrorMessage}")
                    .ToList()),

            NotFoundException notFoundException => (
                HttpStatusCode.NotFound,
                new List<string> { notFoundException.Message }),

            ConflictException conflictException => (
                HttpStatusCode.Conflict,
                new List<string> { conflictException.Message }),

            ForbiddenException forbiddenException => (
                HttpStatusCode.Forbidden,
                new List<string> { forbiddenException.Message }),

            BuildEstate.Domain.Exceptions.BusinessRuleViolationException businessRuleEx => (
                HttpStatusCode.BadRequest,
                new List<string> { businessRuleEx.Message }),

            BuildEstate.Domain.Exceptions.InvalidStateTransitionException stateEx => (
                HttpStatusCode.BadRequest,
                new List<string> { stateEx.Message }),

            BuildEstate.Domain.Exceptions.ApprovalRequiredException approvalEx => (
                HttpStatusCode.BadRequest,
                new List<string> { approvalEx.Message }),

            BuildEstate.Domain.Exceptions.EntityNotFoundException entityNotFoundEx => (
                HttpStatusCode.NotFound,
                new List<string> { entityNotFoundEx.Message }),

            BuildEstate.Domain.Exceptions.DuplicateEntityException duplicateEx => (
                HttpStatusCode.Conflict,
                new List<string> { duplicateEx.Message }),

            _ => (
                HttpStatusCode.InternalServerError,
                new List<string> { "An internal server error has occurred." })
        };
    }
}

/// <summary>
/// Extension method to register the GlobalExceptionHandlerMiddleware in the pipeline.
/// </summary>
public static class GlobalExceptionHandlerMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<GlobalExceptionHandlerMiddleware>();
    }
}
