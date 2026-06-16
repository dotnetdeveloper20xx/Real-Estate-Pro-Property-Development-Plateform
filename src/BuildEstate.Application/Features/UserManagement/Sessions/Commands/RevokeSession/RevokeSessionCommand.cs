using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Sessions.Commands.RevokeSession;

/// <summary>
/// Command to revoke a specific user session.
/// Prevents revoking the current session and immediately invalidates the associated tokens.
/// </summary>
public sealed record RevokeSessionCommand : IRequest<RevokeSessionResult>
{
    /// <summary>The ID of the session to revoke.</summary>
    public Guid SessionId { get; init; }

    /// <summary>
    /// The current session ID of the requesting user.
    /// Used to prevent revoking one's own current session.
    /// </summary>
    public Guid CurrentSessionId { get; init; }

    /// <summary>The user ID of the admin performing the revocation.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>The display name of the admin performing the revocation.</summary>
    public string AdminUserName { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of a session revocation operation.
/// </summary>
public sealed record RevokeSessionResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }

    public static RevokeSessionResult Success() =>
        new() { Succeeded = true };

    public static RevokeSessionResult Failure(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };
}
