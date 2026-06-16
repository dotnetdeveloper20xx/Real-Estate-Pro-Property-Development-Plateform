namespace BuildEstate.Application.Features.UserManagement.Authentication.DTOs;

/// <summary>
/// Represents the result of a successful token operation (login or refresh).
/// Contains the new access token and refresh token issued to the client.
/// </summary>
public sealed record TokenResultDto
{
    /// <summary>The new JWT access token with a 60-minute expiry.</summary>
    public string AccessToken { get; init; } = string.Empty;

    /// <summary>The new refresh token to be stored as an HttpOnly secure cookie.</summary>
    public string RefreshToken { get; init; } = string.Empty;
}
