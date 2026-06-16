using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRole;

/// <summary>
/// Command to update a role's name and description.
/// Built-in roles cannot have their name changed.
/// </summary>
public sealed record UpdateRoleCommand : IRequest<UpdateRoleCommandResult>
{
    /// <summary>The role's unique identifier.</summary>
    public string RoleId { get; init; } = string.Empty;

    /// <summary>The new role name (alphanumeric characters and hyphens only, max 50 characters).</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>The new role description (max 200 characters).</summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>The ID of the admin performing the update.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of the update role operation.
/// </summary>
public sealed record UpdateRoleCommandResult
{
    public bool Succeeded { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static UpdateRoleCommandResult Success() =>
        new() { Succeeded = true };

    public static UpdateRoleCommandResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors };

    public static UpdateRoleCommandResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}
