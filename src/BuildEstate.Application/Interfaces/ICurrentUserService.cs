namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Provides access to the current authenticated user's identity information.
/// Implementations reside in the Infrastructure or API layer.
/// </summary>
public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
}
