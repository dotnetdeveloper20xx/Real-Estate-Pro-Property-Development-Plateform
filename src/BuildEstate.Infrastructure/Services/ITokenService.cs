using BuildEstate.Infrastructure.Identity;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Infrastructure-layer extension of ITokenService that provides convenience overloads
/// accepting ApplicationUser directly. Used by API controllers that have access to the
/// full Identity user object.
/// </summary>
public interface IInfrastructureTokenService : Application.Interfaces.ITokenService
{
    /// <summary>
    /// Generates a new JWT access token (60-minute expiry) and refresh token pair for the given user.
    /// Convenience overload that extracts user properties from the ApplicationUser entity.
    /// The refresh token is stored with optional device and IP information for security tracking.
    /// </summary>
    /// <param name="user">The authenticated user.</param>
    /// <param name="roles">The user's assigned roles.</param>
    /// <param name="rememberMe">If true, refresh token expiry is 30 days; otherwise 7 days.</param>
    /// <param name="deviceInfo">Optional device information (user-agent) for security tracking.</param>
    /// <param name="ipAddress">Optional client IP address for security tracking.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A tuple containing the access token and refresh token strings.</returns>
    Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        ApplicationUser user, IList<string> roles, bool rememberMe = false,
        string? deviceInfo = null, string? ipAddress = null, CancellationToken ct = default);
}
