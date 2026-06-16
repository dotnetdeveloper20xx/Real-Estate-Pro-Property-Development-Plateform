using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRolePermissions;

/// <summary>
/// Command to toggle a single permission on or off for a role.
/// After toggling, all sessions for users assigned to that role are revoked
/// to enforce immediate permission enforcement.
/// </summary>
public sealed record UpdateRolePermissionsCommand : IRequest<UpdateRolePermissionsCommandResult>
{
    /// <summary>The role's unique identifier.</summary>
    public string RoleId { get; init; } = string.Empty;

    /// <summary>The permission's unique identifier to toggle.</summary>
    public Guid PermissionId { get; init; }

    /// <summary>The ID of the admin performing the permission change.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of the permission toggle operation.
/// </summary>
public sealed record UpdateRolePermissionsCommandResult
{
    public bool Succeeded { get; init; }

    /// <summary>True if the permission is now granted; false if revoked.</summary>
    public bool IsGranted { get; init; }

    public IReadOnlyList<string> Errors { get; init; } = [];

    public static UpdateRolePermissionsCommandResult Success(bool isGranted) =>
        new() { Succeeded = true, IsGranted = isGranted };

    public static UpdateRolePermissionsCommandResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors };

    public static UpdateRolePermissionsCommandResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}
