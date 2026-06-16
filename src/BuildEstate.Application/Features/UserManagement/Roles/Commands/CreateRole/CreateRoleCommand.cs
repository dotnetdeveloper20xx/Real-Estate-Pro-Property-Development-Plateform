using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.CreateRole;

/// <summary>
/// Command to create a new role with an optional set of initial permissions.
/// Validates role name (alphanumeric + hyphens, max 50), description (max 200),
/// and name uniqueness before creating the role and assigning permissions.
/// </summary>
public sealed record CreateRoleCommand : IRequest<CreateRoleCommandResult>
{
    /// <summary>Role name (alphanumeric characters and hyphens only, max 50 characters).</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>Role description (max 200 characters).</summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>Optional list of permission IDs to assign to the role on creation.</summary>
    public IReadOnlyList<Guid> PermissionIds { get; init; } = [];

    /// <summary>The ID of the admin performing the creation.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of the create role operation.
/// On success, contains the new role's ID.
/// On failure, contains one or more error messages.
/// </summary>
public sealed record CreateRoleCommandResult
{
    public bool Succeeded { get; init; }
    public string? RoleId { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static CreateRoleCommandResult Success(string roleId) =>
        new() { Succeeded = true, RoleId = roleId };

    public static CreateRoleCommandResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors };

    public static CreateRoleCommandResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}
