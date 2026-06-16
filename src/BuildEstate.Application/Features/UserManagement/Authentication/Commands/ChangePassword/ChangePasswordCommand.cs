using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.ChangePassword;

/// <summary>
/// Command to change a user's password. Validates the current password,
/// enforces password policy and history (last 5), updates the password,
/// records in history, revokes all sessions, and logs an audit entry.
/// </summary>
public sealed record ChangePasswordCommand : IRequest<ChangePasswordResult>
{
    /// <summary>
    /// The ID of the user changing their password.
    /// </summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// The user's current password for verification.
    /// </summary>
    public string CurrentPassword { get; init; } = string.Empty;

    /// <summary>
    /// The new password to set.
    /// </summary>
    public string NewPassword { get; init; } = string.Empty;

    /// <summary>
    /// Client IP address for audit logging.
    /// </summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>
    /// Request correlation ID for distributed tracing.
    /// </summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of the change password operation.
/// </summary>
public sealed record ChangePasswordResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }

    public static ChangePasswordResult Success() => new() { Succeeded = true };
    public static ChangePasswordResult Failure(string errorMessage) => new() { Succeeded = false, ErrorMessage = errorMessage };
}
