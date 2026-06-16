namespace BuildEstate.Application.Features.UserManagement.Authentication.DTOs;

/// <summary>
/// Response returned on successful authentication.
/// Contains the access token, refresh token, and authenticated user profile.
/// </summary>
public sealed record LoginResponseDto
{
    /// <summary>JWT access token with 60-minute expiry.</summary>
    public string AccessToken { get; init; } = string.Empty;

    /// <summary>
    /// Refresh token value. In production this is set as an HttpOnly Secure SameSite=Strict cookie
    /// and should NOT be exposed in the response body. Included here for the handler to pass
    /// to the controller layer which handles the cookie setup.
    /// </summary>
    public string RefreshToken { get; init; } = string.Empty;

    /// <summary>Authenticated user profile information.</summary>
    public LoginUserDto User { get; init; } = null!;
}

/// <summary>
/// Minimal user profile included in the login response.
/// </summary>
public sealed record LoginUserDto
{
    public string Id { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public IReadOnlyList<string> Roles { get; init; } = [];
}
