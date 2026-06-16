using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.CreateUser;

/// <summary>
/// Command to create a new user account with assigned roles.
/// Validates all fields (name, email format, email uniqueness, password policy, role existence),
/// creates the user via Identity, assigns roles, records password history, and logs an audit entry.
/// </summary>
public sealed record CreateUserCommand : IRequest<CreateUserResult>
{
    /// <summary>User's first name.</summary>
    public string FirstName { get; init; } = string.Empty;

    /// <summary>User's last name.</summary>
    public string LastName { get; init; } = string.Empty;

    /// <summary>User's email address (must be unique).</summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>Plaintext password conforming to password policy.</summary>
    public string Password { get; init; } = string.Empty;

    /// <summary>List of role names to assign to the user.</summary>
    public IReadOnlyList<string> Roles { get; init; } = [];

    /// <summary>The ID of the admin performing the creation.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of the create user operation.
/// On success, contains the new user's ID.
/// On failure, contains one or more error messages.
/// </summary>
public sealed record CreateUserResult
{
    public bool Succeeded { get; init; }
    public string? UserId { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static CreateUserResult Success(string userId) =>
        new() { Succeeded = true, UserId = userId };

    public static CreateUserResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors };

    public static CreateUserResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}
