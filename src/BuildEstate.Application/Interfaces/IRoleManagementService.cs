namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides role management operations wrapping ASP.NET Identity's RoleManager.
/// Abstracts role creation, update, deletion, and permission assignment
/// for the Application layer without exposing Infrastructure-level Identity types.
/// </summary>
public interface IRoleManagementService
{
    /// <summary>
    /// Checks whether a role with the specified name already exists.
    /// </summary>
    /// <param name="roleName">The role name to check.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if a role with the given name exists; otherwise false.</returns>
    Task<bool> RoleNameExistsAsync(string roleName, CancellationToken ct = default);

    /// <summary>
    /// Creates a new role with the specified name and description.
    /// </summary>
    /// <param name="name">The role name (alphanumeric and hyphens, max 50 chars).</param>
    /// <param name="description">The role description (max 200 chars).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success with the role ID, or failure with errors.</returns>
    Task<CreateRoleResult> CreateRoleAsync(string name, string description, CancellationToken ct = default);

    /// <summary>
    /// Assigns a set of permissions to a role by their IDs.
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="permissionIds">The permission IDs to assign.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success or failure.</returns>
    Task<IdentityOperationResult> AssignPermissionsAsync(
        string roleId, IReadOnlyList<Guid> permissionIds, CancellationToken ct = default);

    /// <summary>
    /// Checks whether all specified permission IDs exist in the system.
    /// </summary>
    /// <param name="permissionIds">The permission IDs to verify.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A list of permission IDs that do not exist.</returns>
    Task<IReadOnlyList<Guid>> GetNonExistentPermissionIdsAsync(
        IReadOnlyList<Guid> permissionIds, CancellationToken ct = default);

    /// <summary>
    /// Updates an existing role's name and description.
    /// Rejects updates to built-in roles if the name is being changed.
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="name">The new role name.</param>
    /// <param name="description">The new description.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success or failure with errors.</returns>
    Task<IdentityOperationResult> UpdateRoleAsync(
        string roleId, string name, string description, CancellationToken ct = default);

    /// <summary>
    /// Deletes a role. Built-in roles cannot be deleted.
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating success or failure with errors.</returns>
    Task<IdentityOperationResult> DeleteRoleAsync(string roleId, CancellationToken ct = default);

    /// <summary>
    /// Checks whether a role is a built-in role (cannot be deleted or renamed).
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the role is built-in; otherwise false.</returns>
    Task<bool> IsBuiltInRoleAsync(string roleId, CancellationToken ct = default);

    /// <summary>
    /// Gets the count of users currently assigned to a role.
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The number of users assigned to the role.</returns>
    Task<int> GetUserCountForRoleAsync(string roleId, CancellationToken ct = default);

    /// <summary>
    /// Gets the name of a role by its ID.
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The role name, or null if not found.</returns>
    Task<string?> GetRoleNameAsync(string roleId, CancellationToken ct = default);

    /// <summary>
    /// Checks whether a role name already exists, excluding a specific role ID (for updates).
    /// </summary>
    /// <param name="roleName">The role name to check.</param>
    /// <param name="excludeRoleId">The role ID to exclude from the check.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if another role with the same name exists.</returns>
    Task<bool> RoleNameExistsExcludingAsync(string roleName, string excludeRoleId, CancellationToken ct = default);

    /// <summary>
    /// Toggles a permission on or off for a role.
    /// If the role has the permission, it is removed; if not, it is added.
    /// </summary>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <param name="permissionId">The permission's unique identifier.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A result indicating the new state (granted=true or revoked=false).</returns>
    Task<TogglePermissionResult> TogglePermissionAsync(
        string roleId, Guid permissionId, CancellationToken ct = default);
}

/// <summary>
/// Result of a permission toggle operation.
/// </summary>
public sealed record TogglePermissionResult
{
    public bool Succeeded { get; init; }

    /// <summary>True if the permission is now granted; false if revoked.</summary>
    public bool IsGranted { get; init; }

    public IReadOnlyList<string> Errors { get; init; } = [];

    public static TogglePermissionResult Granted() =>
        new() { Succeeded = true, IsGranted = true };

    public static TogglePermissionResult Revoked() =>
        new() { Succeeded = true, IsGranted = false };

    public static TogglePermissionResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors };
}

/// <summary>
/// Result of a role creation operation.
/// </summary>
public sealed record CreateRoleResult
{
    public bool Succeeded { get; init; }
    public string? RoleId { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static CreateRoleResult Success(string roleId) =>
        new() { Succeeded = true, RoleId = roleId };

    public static CreateRoleResult Failure(IReadOnlyList<string> errors) =>
        new() { Succeeded = false, Errors = errors };

    public static CreateRoleResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors };
}
