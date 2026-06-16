using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.ResetPassword;

/// <summary>
/// Command for admin-initiated password reset. Unlike ChangePassword (user-initiated),
/// this command does not require the current password and is performed by an admin
/// on behalf of a target user. Validates the new password against policy and history,
/// updates the password, records password history, revokes all sessions/tokens,
/// and logs an audit entry.
/// </summary>
public sealed record ResetPasswordCommand : IRequest<ResetPasswordResult>
{
    /// <summary>
    /// The ID of the target user whose password is being reset.
    /// </summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// The new password to set for the user.
    /// </summary>
    public string NewPassword { get; init; } = string.Empty;

    /// <summary>
    /// The ID of the admin performing the password reset.
    /// </summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>
    /// The display name of the admin performing the reset (for audit logging).
    /// </summary>
    public string AdminUserName { get; init; } = string.Empty;

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
/// Result of the admin password reset operation.
/// </summary>
public sealed record ResetPasswordResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }

    public static ResetPasswordResult Success() => new() { Succeeded = true };
    public static ResetPasswordResult Failure(string errorMessage) => new() { Succeeded = false, ErrorMessage = errorMessage };
}
