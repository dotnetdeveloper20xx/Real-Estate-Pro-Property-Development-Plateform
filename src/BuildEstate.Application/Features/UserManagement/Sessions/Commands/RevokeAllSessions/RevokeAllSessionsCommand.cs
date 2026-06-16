using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Sessions.Commands.RevokeAllSessions;

/// <summary>
/// Command to revoke all sessions for a user except the current session.
/// Immediately invalidates all tokens for affected sessions.
/// </summary>
public sealed record RevokeAllSessionsCommand : IRequest<RevokeAllSessionsResult>
{
    /// <summary>The user ID whose sessions should be revoked.</summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// The current session ID to exclude from revocation.
    /// The current session is kept active.
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
/// Result of revoking all sessions for a user.
/// </summary>
public sealed record RevokeAllSessionsResult
{
    public bool Succeeded { get; init; }
    public int RevokedCount { get; init; }
    public string? ErrorMessage { get; init; }

    public static RevokeAllSessionsResult Success(int revokedCount) =>
        new() { Succeeded = true, RevokedCount = revokedCount };

    public static RevokeAllSessionsResult Failure(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };
}
