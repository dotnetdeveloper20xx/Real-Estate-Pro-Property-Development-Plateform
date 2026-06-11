using BuildEstate.Infrastructure.Identity;

namespace BuildEstate.Infrastructure.Services;

public interface ITokenService
{
    Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        ApplicationUser user, IList<string> roles);

    Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(string refreshToken);

    Task RevokeAllUserTokensAsync(string userId);
}
