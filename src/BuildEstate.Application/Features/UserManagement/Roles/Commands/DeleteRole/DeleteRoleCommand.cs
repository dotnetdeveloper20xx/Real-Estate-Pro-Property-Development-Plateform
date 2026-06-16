using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.DeleteRole;

/// <summary>
/// Command to delete a role.
/// Built-in roles cannot be deleted.
/// If users are assigned to the role, returns a warning with user count and requires explicit confirmation.
/// </summary>
public sealed record DeleteRoleCommand : IRequest<DeleteRoleCommandResult>
{
    /// <summary>The role's unique identifier.</summary>
    public string RoleId { get; init; } = string.Empty;

    /// <summary>
    /// Whether the admin has explicitly confirmed deletion despite users being assigned.
    /// Set to true to bypass the user count warning.
    /// </summary>
    public bool ConfirmDeletion { get; init; }

    /// <summary>The ID of the admin performing the deletion.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of the delete role operation.
/// </summary>
public sealed record DeleteRoleCommandResult
{
    public bool Succeeded { get; init; }

    /// <summary>
    /// If true, indicates that users are assigned to this role and confirmation is required.
    /// The client should re-submit with ConfirmDeletion = true.
    /// </summary>
    public bool RequiresConfirmation { get; init; }

    /// <summary>Number of users assigned to the role (populated when RequiresConfirmation is true).</summary>
    public int AffectedUserCount { get; init; }

    public IReadOnlyList<string> Errors { get; init; } = [];

    public static DeleteRoleCommandResult Success() =>
        new() { Succeeded = true };

    public static DeleteRoleCommandResult ConfirmationRequired(int userCount) =>
        new() { Succeeded = false, RequiresConfirmation = true, AffectedUserCount = userCount, Errors = [$"This role has {userCount} user(s) assigned. Please confirm deletion."] };

    public static DeleteRoleCommandResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors };

    public static DeleteRoleCommandResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}
