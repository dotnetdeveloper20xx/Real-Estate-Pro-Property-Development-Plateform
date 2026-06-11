using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BuildEstate.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly BuildEstateDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public TokenService(
        IConfiguration configuration,
        BuildEstateDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        _configuration = configuration;
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        ApplicationUser user, IList<string> roles)
    {
        var accessToken = GenerateAccessToken(user, roles);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        return (accessToken, refreshToken);
    }

    public async Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _dbContext.Set<RefreshToken>()
            .FirstOrDefaultAsync(t => t.Token == refreshToken);

        if (storedToken is null)
        {
            throw new InvalidOperationException("Invalid refresh token.");
        }

        // If the token was already used (consumed), this is a potential token theft scenario.
        // Revoke all tokens for the user as a security measure.
        if (storedToken.IsUsed)
        {
            await RevokeAllUserTokensAsync(storedToken.UserId);
            throw new InvalidOperationException(
                "Refresh token has already been consumed. All tokens have been revoked for security.");
        }

        if (storedToken.IsRevoked)
        {
            throw new InvalidOperationException("Refresh token has been revoked.");
        }

        if (storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Refresh token has expired.");
        }

        // Mark the current token as used
        storedToken.IsUsed = true;

        // Get the user and their roles
        var user = await _userManager.FindByIdAsync(storedToken.UserId);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var roles = await _userManager.GetRolesAsync(user);

        // Generate new tokens
        var newAccessToken = GenerateAccessToken(user, roles);
        var newRefreshToken = await CreateRefreshTokenAsync(user.Id);

        await _dbContext.SaveChangesAsync();

        return (newAccessToken, newRefreshToken);
    }

    public async Task RevokeAllUserTokensAsync(string userId)
    {
        var activeTokens = await _dbContext.Set<RefreshToken>()
            .Where(t => t.UserId == userId && !t.IsUsed && !t.IsRevoked)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _dbContext.SaveChangesAsync();
    }

    private string GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is not configured.");
        var audience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT Audience is not configured.");
        var secretKey = _configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("JWT SecretKey is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(60),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> CreateRefreshTokenAsync(string userId)
    {
        var tokenValue = GenerateSecureRandomToken();

        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = tokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        await _dbContext.Set<RefreshToken>().AddAsync(refreshToken);
        await _dbContext.SaveChangesAsync();

        return tokenValue;
    }

    private static string GenerateSecureRandomToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
