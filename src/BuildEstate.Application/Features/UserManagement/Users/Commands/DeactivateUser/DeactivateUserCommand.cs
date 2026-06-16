using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.DeactivateUser;

/// <summary>
/// Command to deactivate a user account. Sets IsActive to false,
/// revokes all active sessions and tokens, and logs an audit entry.
/// Session revocation is retried up to 3 times on failure.
/// </summary>
public sealed record DeactivateUserCommand : IRequest<DeactivateUserResult>
{
    /// <summary>The ID of the user to deactivate.</summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>The ID of the admin performing the deactivation.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>The display name of the admin performing the deactivation.</summary>
    public string AdminUserName { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing and audit log linkage.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of a user deactivation operation.
/// </summary>
public sealed record DeactivateUserResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }
    public bool SessionRevocationFailed { get; init; }

    public static DeactivateUserResult Success() =>
        new() { Succeeded = true };

    public static DeactivateUserResult Failure(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };

    public static DeactivateUserResult SuccessWithSessionRevocationWarning(string errorMessage) =>
        new() { Succeeded = true, SessionRevocationFailed = true, ErrorMessage = errorMessage };
}
