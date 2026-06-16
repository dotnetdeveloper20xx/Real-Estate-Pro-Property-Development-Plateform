using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.ReactivateUser;

/// <summary>
/// Command to reactivate a previously deactivated user account.
/// Sets IsActive to true and logs an audit entry with old/new values.
/// </summary>
public sealed record ReactivateUserCommand : IRequest<ReactivateUserResult>
{
    /// <summary>The ID of the user to reactivate.</summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>The ID of the admin performing the reactivation.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>The display name of the admin performing the reactivation.</summary>
    public string AdminUserName { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing and audit log linkage.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of a user reactivation operation.
/// </summary>
public sealed record ReactivateUserResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }

    public static ReactivateUserResult Success() =>
        new() { Succeeded = true };

    public static ReactivateUserResult Failure(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };
}
