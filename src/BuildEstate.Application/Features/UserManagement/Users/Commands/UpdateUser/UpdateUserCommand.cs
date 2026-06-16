using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.UpdateUser;

/// <summary>
/// Command to update a user's profile fields (name, email) and role assignments.
/// When roles change, all active sessions and tokens are revoked for immediate enforcement,
/// and an audit entry is recorded with old/new values.
/// </summary>
public sealed record UpdateUserCommand : IRequest<UpdateUserResult>
{
    /// <summary>The unique identifier of the user to update.</summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>The user's new first name.</summary>
    public string FirstName { get; init; } = string.Empty;

    /// <summary>The user's new last name.</summary>
    public string LastName { get; init; } = string.Empty;

    /// <summary>The user's new email address.</summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>The complete set of roles the user should have after the update.</summary>
    public IList<string> Roles { get; init; } = [];

    /// <summary>The ID of the admin performing the update.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing and audit log linkage.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result wrapper for update user operations. Provides success/failure semantics
/// without throwing exceptions for expected business outcomes (user not found, email taken).
/// </summary>
public sealed record UpdateUserResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }

    public static UpdateUserResult Success() =>
        new() { Succeeded = true };

    public static UpdateUserResult Failure(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };
}
