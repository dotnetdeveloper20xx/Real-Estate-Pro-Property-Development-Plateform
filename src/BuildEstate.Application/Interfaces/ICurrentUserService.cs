namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides access to the current authenticated user's identity information.
/// Implementations reside in the Infrastructure or API layer.
/// </summary>
public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }

    /// <summary>
    /// Determines whether the current user belongs to the specified role.
    /// </summary>
    bool IsInRole(string role);
}
