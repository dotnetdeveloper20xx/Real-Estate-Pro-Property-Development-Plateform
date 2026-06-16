using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class TokenServiceTests : IDisposable
{
    private readonly BuildEstateDbContext _dbContext;
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<ILogger<TokenService>> _loggerMock;
    private readonly IConfiguration _configuration;
    private readonly TokenService _sut;

    public TokenServiceTests()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new BuildEstateDbContext(options);

        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _loggerMock = new Mock<ILogger<TokenService>>();

        var configData = new Dictionary<string, string?>
        {
            ["JwtSettings:Issuer"] = "BuildEstate-Test",
            ["JwtSettings:Audience"] = "BuildEstate-Test-Audience",
            ["JwtSettings:Secret"] = "ThisIsAVeryLongSecretKeyForTestingPurposes12345678!"
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        _sut = new TokenService(_configuration, _dbContext, _userManagerMock.Object, _loggerMock.Object);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private static ApplicationUser CreateTestUser(string? id = null)
    {
        return new ApplicationUser
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Email = "test@buildestate.com",
            FirstName = "John",
            LastName = "Doe",
            IsActive = true
        };
    }

    #region GenerateTokensAsync Tests

    [Fact]
    public async Task GenerateTokensAsync_WithValidUser_ReturnsAccessTokenAndRefreshToken()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin", "ProjectManager" };

        // Act
        var (accessToken, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // Assert
        accessToken.Should().NotBeNullOrWhiteSpace();
        refreshToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GenerateTokensAsync_AccessTokenContainsCorrectClaims()
    {
        // Arrange
        var user = CreateTestUser();
        user.Email = "admin@buildestate.com";
        var roles = new List<string> { "SuperAdmin", "FinanceDirector" };

        // Act
        var (accessToken, _) = await _sut.GenerateTokensAsync(user, roles);

        // Assert — validate the JWT payload by decoding the raw token
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(accessToken);

        // Verify token expiry is correct (60 min from now)
        jwt.ValidTo.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(60), TimeSpan.FromSeconds(5));

        // Decode payload from the raw JWT to verify all claims
        var parts = accessToken.Split('.');
        var payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));
        var payload = System.Text.Json.JsonDocument.Parse(payloadJson).RootElement;

        // Verify user ID (sub claim)
        payload.GetProperty("sub").GetString().Should().Be(user.Id,
            "token should contain the user's ID as sub claim");

        // Verify email
        payload.GetProperty("email").GetString().Should().Be(user.Email,
            "token should contain the user's email");

        // Verify full name
        payload.GetProperty("full_name").GetString()
            .Should().Be($"{user.FirstName} {user.LastName}");

        // Verify roles
        var roleArray = payload.GetProperty("role");
        var tokenRoles = roleArray.EnumerateArray().Select(r => r.GetString()!).ToList();
        tokenRoles.Should().BeEquivalentTo(roles);
    }

    [Fact]
    public async Task GenerateTokensAsync_AccessTokenHas60MinuteExpiry()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        // Act
        var (accessToken, _) = await _sut.GenerateTokensAsync(user, roles);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(accessToken);

        // ValidTo should be set to ~60 minutes from now
        jwt.ValidTo.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(60), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GenerateTokensAsync_DefaultRefreshTokenExpiry_Is7Days()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        // Act
        await _sut.GenerateTokensAsync(user, roles, rememberMe: false);

        // Assert
        var storedToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync();
        storedToken.Should().NotBeNull();

        var expectedExpiry = DateTime.UtcNow.AddDays(7);
        storedToken!.ExpiresAt.Should().BeCloseTo(expectedExpiry, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GenerateTokensAsync_RememberMe_RefreshTokenExpiryIs30Days()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        // Act
        await _sut.GenerateTokensAsync(user, roles, rememberMe: true);

        // Assert
        var storedToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync();
        storedToken.Should().NotBeNull();

        var expectedExpiry = DateTime.UtcNow.AddDays(30);
        storedToken!.ExpiresAt.Should().BeCloseTo(expectedExpiry, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GenerateTokensAsync_StoresRefreshTokenInDatabase()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        // Act
        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // Assert
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken);

        storedToken.Should().NotBeNull();
        storedToken!.UserId.Should().Be(user.Id);
        storedToken.IsUsed.Should().BeFalse();
        storedToken.IsRevoked.Should().BeFalse();
    }

    #endregion

    #region RefreshTokenAsync Tests

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_ReturnsNewTokenPair()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        _userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(roles);

        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // Act
        var (newAccessToken, newRefreshToken) = await _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Assert
        newAccessToken.Should().NotBeNullOrWhiteSpace();
        newRefreshToken.Should().NotBeNullOrWhiteSpace();
        newRefreshToken.Should().NotBe(refreshToken);
    }

    [Fact]
    public async Task RefreshTokenAsync_MarksOldTokenAsUsed()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        _userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(roles);

        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // Act
        await _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Assert
        var oldToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken);
        oldToken!.IsUsed.Should().BeTrue();
        oldToken.UsedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task RefreshTokenAsync_WithInvalidToken_ThrowsException()
    {
        // Act
        var act = () => _sut.RefreshTokenAsync("invalid-token-value", "127.0.0.1", "TestBrowser/1.0");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid refresh token.");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithRevokedToken_ThrowsException()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };
        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // Revoke the token
        var storedToken = await _dbContext.RefreshTokens.FirstAsync(t => t.Token == refreshToken);
        storedToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();

        // Act
        var act = () => _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Refresh token has been revoked.");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ThrowsException()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };
        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // Expire the token
        var storedToken = await _dbContext.RefreshTokens.FirstAsync(t => t.Token == refreshToken);
        storedToken.ExpiresAt = DateTime.UtcNow.AddHours(-1);
        await _dbContext.SaveChangesAsync();

        // Act
        var act = () => _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Refresh token has expired.");
    }

    [Fact]
    public async Task RefreshTokenAsync_UsedTokenWithinGracePeriod_ReturnsNewAccessToken()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        _userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(roles);

        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // First refresh — marks token as used
        var (_, newRefreshToken) = await _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Act — second refresh with old token within 30-second grace period
        var (graceAccessToken, graceRefreshToken) = await _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Assert
        graceAccessToken.Should().NotBeNullOrWhiteSpace();
        graceRefreshToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task RefreshTokenAsync_UsedTokenBeyondGracePeriod_RevokesAllAndThrows()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        _userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(roles);

        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles);

        // Mark token as used with a timestamp beyond grace period
        var storedToken = await _dbContext.RefreshTokens.FirstAsync(t => t.Token == refreshToken);
        storedToken.IsUsed = true;
        storedToken.UsedAt = DateTime.UtcNow.AddSeconds(-31); // Beyond 30-second grace
        await _dbContext.SaveChangesAsync();

        // Act
        var act = () => _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already been consumed*revoked for security*");

        // All tokens should be revoked
        var allTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == user.Id)
            .ToListAsync();
        allTokens.Should().AllSatisfy(t => t.IsRevoked.Should().BeTrue());
    }

    [Fact]
    public async Task RefreshTokenAsync_DeactivatedUser_ThrowsException()
    {
        // Arrange
        var user = CreateTestUser();
        user.IsActive = false;
        var roles = new List<string> { "Admin" };

        _userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);

        // Manually create a valid refresh token
        var token = new RefreshToken
        {
            UserId = user.Id,
            Token = "valid-refresh-token",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.RefreshTokens.Add(token);
        await _dbContext.SaveChangesAsync();

        // Act
        var act = () => _sut.RefreshTokenAsync("valid-refresh-token", "127.0.0.1", "TestBrowser/1.0");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User account is deactivated.");
    }

    #endregion

    #region RevokeAllUserTokensAsync Tests

    [Fact]
    public async Task RevokeAllUserTokensAsync_RevokesAllActiveTokens()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        await _sut.GenerateTokensAsync(user, roles);
        await _sut.GenerateTokensAsync(user, roles);
        await _sut.GenerateTokensAsync(user, roles);

        // Act
        await _sut.RevokeAllUserTokensAsync(user.Id);

        // Assert
        var tokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == user.Id)
            .ToListAsync();

        tokens.Should().HaveCount(3);
        tokens.Should().AllSatisfy(t => t.IsRevoked.Should().BeTrue());
    }

    [Fact]
    public async Task RevokeAllUserTokensAsync_DoesNotAffectOtherUsers()
    {
        // Arrange
        var user1 = CreateTestUser("user-1");
        var user2 = CreateTestUser("user-2");
        var roles = new List<string> { "Admin" };

        await _sut.GenerateTokensAsync(user1, roles);
        await _sut.GenerateTokensAsync(user2, roles);

        // Act
        await _sut.RevokeAllUserTokensAsync(user1.Id);

        // Assert
        var user2Tokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == user2.Id)
            .ToListAsync();

        user2Tokens.Should().AllSatisfy(t => t.IsRevoked.Should().BeFalse());
    }

    #endregion

    #region RevokeTokenAsync Tests

    [Fact]
    public async Task RevokeTokenAsync_RevokesSpecificToken()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        await _sut.GenerateTokensAsync(user, roles);
        var storedToken = await _dbContext.RefreshTokens.FirstAsync();

        // Act
        await _sut.RevokeTokenAsync(storedToken.Id);

        // Assert
        var token = await _dbContext.RefreshTokens.FindAsync(storedToken.Id);
        token!.IsRevoked.Should().BeTrue();
    }

    [Fact]
    public async Task RevokeTokenAsync_NonExistentToken_DoesNotThrow()
    {
        // Act
        var act = () => _sut.RevokeTokenAsync(Guid.NewGuid());

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task RevokeTokenAsync_AlreadyRevokedToken_IsIdempotent()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        await _sut.GenerateTokensAsync(user, roles);
        var storedToken = await _dbContext.RefreshTokens.FirstAsync();
        storedToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();

        // Act
        var act = () => _sut.RevokeTokenAsync(storedToken.Id);

        // Assert
        await act.Should().NotThrowAsync();
    }

    #endregion

    #region Token Rotation Preserves Remember Me

    [Fact]
    public async Task RefreshTokenAsync_PreservesRememberMeExpiry()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin" };

        _userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(roles);

        // Generate with remember me (30-day expiry)
        var (_, refreshToken) = await _sut.GenerateTokensAsync(user, roles, rememberMe: true);

        // Act
        var (_, newRefreshToken) = await _sut.RefreshTokenAsync(refreshToken, "127.0.0.1", "TestBrowser/1.0");

        // Assert — new token should also have 30-day expiry
        var newStoredToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == newRefreshToken);

        var expectedExpiry = DateTime.UtcNow.AddDays(30);
        newStoredToken!.ExpiresAt.Should().BeCloseTo(expectedExpiry, TimeSpan.FromSeconds(5));
    }

    #endregion

    #region Helpers

    private static byte[] Base64UrlDecode(string input)
    {
        var output = input.Replace('-', '+').Replace('_', '/');
        switch (output.Length % 4)
        {
            case 2: output += "=="; break;
            case 3: output += "="; break;
        }
        return Convert.FromBase64String(output);
    }

    #endregion
}
