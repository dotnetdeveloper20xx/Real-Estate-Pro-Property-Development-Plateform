using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.Login;

/// <summary>
/// Command to authenticate a user with email and password credentials.
/// Returns a login response with tokens and user profile on success,
/// or a failure result with a generic error message on failure.
/// </summary>
public sealed record LoginCommand : IRequest<LoginResult>
{
    /// <summary>User's email address.</summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>User's plaintext password.</summary>
    public string Password { get; init; } = string.Empty;

    /// <summary>If true, refresh token uses 30-day expiry instead of 7-day default.</summary>
    public bool RememberMe { get; init; }

    /// <summary>Client IP address for audit logging and session tracking.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Client User-Agent header for session device tracking.</summary>
    public string UserAgent { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing and audit log linkage.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result wrapper for login operations. Provides success/failure semantics
/// without throwing exceptions for expected business outcomes (invalid credentials, lockout).
/// </summary>
public sealed record LoginResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }
    public LoginResponseDto? Response { get; init; }

    public static LoginResult Success(LoginResponseDto response) =>
        new() { Succeeded = true, Response = response };

    public static LoginResult Failure(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };
}
