using System.IdentityModel.Tokens.Jwt;
using System.Text;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Token Refresh Rotation.
/// Verifies that for any valid, non-expired, non-revoked refresh token,
/// calling RefreshTokenAsync produces:
/// - A new access token with 60-minute expiry
/// - A new refresh token (different from the old one)
/// - The old refresh token marked as Used
///
/// **Validates: Requirements 2.3**
/// </summary>
public class TokenRefreshRotationPropertyTests
{
    private const string TestIssuer = "BuildEstate-Test";
    private const string TestAudience = "BuildEstate-Test-Audience";
    private const string TestSecret = "ThisIsAVeryLongSecretKeyForTestingPurposes12345678!";

    #region Property 18: Token Refresh Produces Valid New Token Pair

    /// <summary>
    /// Property 18: For any valid non-expired non-revoked refresh token,
    /// verify refresh produces a new access token with 60-minute expiry
    /// and a new refresh token, and invalidates the old one.
    ///
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property RefreshToken_ProducesNewAccessTokenWith60MinExpiry_AndNewRefreshToken_AndInvalidatesOld()
    {
        var userGen = from firstName in Gen.Elements("Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona")
                      from lastName in Gen.Elements("Smith", "Jones", "Williams", "Brown", "Taylor", "Davies")
                      from roleSeed in Gen.Choose(1, 13)
                      select new
                      {
                          FirstName = firstName,
                          LastName = lastName,
                          Email = $"{firstName.ToLower()}.{lastName.ToLower()}@buildestate.com",
                          Roles = GetRolesForSeed(roleSeed)
                      };

        return Prop.ForAll(
            userGen.ToArbitrary(),
            userData =>
            {
                // Arrange
                var (service, dbContext, userManagerMock, user) = CreateServiceWithUser(
                    userData.FirstName, userData.LastName, userData.Email, userData.Roles);

                using (dbContext)
                {
                    // Generate initial token pair
                    var (_, initialRefreshToken) = service.GenerateTokensAsync(
                        user, (IList<string>)userData.Roles)
                        .GetAwaiter().GetResult();

                    // Act: Refresh the token
                    var (newAccessToken, newRefreshToken) = service.RefreshTokenAsync(
                        initialRefreshToken, "192.168.1.1", "TestBrowser/2.0")
                        .GetAwaiter().GetResult();

                    // Assert 1: New access token is not null/empty
                    var accessTokenValid = !string.IsNullOrWhiteSpace(newAccessToken);

                    // Assert 2: New access token has 60-minute expiry
                    var handler = new JwtSecurityTokenHandler();
                    var jwt = handler.ReadJwtToken(newAccessToken);
                    var expiryDiff = Math.Abs((jwt.ValidTo - DateTime.UtcNow.AddMinutes(60)).TotalSeconds);
                    var expiryCorrect = expiryDiff < 5; // Within 5 seconds tolerance

                    // Assert 3: New refresh token is different from old one
                    var refreshTokenRotated = newRefreshToken != initialRefreshToken;

                    // Assert 4: New refresh token is not null/empty
                    var newRefreshTokenValid = !string.IsNullOrWhiteSpace(newRefreshToken);

                    // Assert 5: Old refresh token is marked as used
                    var oldToken = dbContext.RefreshTokens
                        .FirstOrDefault(t => t.Token == initialRefreshToken);
                    var oldTokenMarkedUsed = oldToken is not null && oldToken.IsUsed;
                    var oldTokenHasUsedAt = oldToken?.UsedAt is not null;

                    return (accessTokenValid && expiryCorrect && refreshTokenRotated &&
                            newRefreshTokenValid && oldTokenMarkedUsed && oldTokenHasUsedAt)
                        .Label($"User={userData.FirstName} {userData.LastName}, " +
                               $"AccessTokenValid={accessTokenValid}, ExpiryCorrect={expiryCorrect}, " +
                               $"Rotated={refreshTokenRotated}, NewTokenValid={newRefreshTokenValid}, " +
                               $"OldMarkedUsed={oldTokenMarkedUsed}, UsedAtSet={oldTokenHasUsedAt}");
                }
            });
    }

    /// <summary>
    /// Property 18 (complementary): For any valid refresh token with any combination of roles,
    /// the new access token contains the correct user claims (sub, email, roles).
    ///
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property RefreshToken_NewAccessToken_ContainsCorrectUserClaims()
    {
        var roleSubsetGen = Gen.SubListOf(new[]
            {
                "SuperAdmin", "AcquisitionManager", "LegalOfficer", "PlanningManager",
                "ProjectManager", "SiteManager", "SalesManager", "CompletionManager",
                "PropertyManager", "FinanceDirector", "ValuationAnalyst", "Surveyor", "Admin"
            })
            .Where(roles => roles.Count > 0);

        return Prop.ForAll(
            roleSubsetGen.ToArbitrary(),
            roles =>
            {
                // Arrange
                var roleList = roles.ToList();
                var (service, dbContext, userManagerMock, user) = CreateServiceWithUser(
                    "Test", "User", "test.user@buildestate.com", roleList);

                using (dbContext)
                {
                    // Generate initial token pair
                    var (_, initialRefreshToken) = service.GenerateTokensAsync(
                        user, roleList)
                        .GetAwaiter().GetResult();

                    // Act: Refresh the token
                    var (newAccessToken, _) = service.RefreshTokenAsync(
                        initialRefreshToken, "10.0.0.1", "Chrome/120")
                        .GetAwaiter().GetResult();

                    // Decode new access token
                    var parts = newAccessToken.Split('.');
                    var payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));
                    var payload = System.Text.Json.JsonDocument.Parse(payloadJson).RootElement;

                    // Assert: sub claim matches user ID
                    var subCorrect = payload.GetProperty("sub").GetString() == user.Id;

                    // Assert: email claim matches user email
                    var emailCorrect = payload.GetProperty("email").GetString() == user.Email;

                    // Assert: all roles are present in the token
                    var roleElement = payload.GetProperty("role");
                    List<string> tokenRoles;
                    if (roleElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        tokenRoles = roleElement.EnumerateArray()
                            .Select(r => r.GetString()!)
                            .ToList();
                    }
                    else
                    {
                        tokenRoles = new List<string> { roleElement.GetString()! };
                    }

                    var rolesCorrect = roleList.All(r => tokenRoles.Contains(r))
                                       && tokenRoles.Count == roleList.Count;

                    return (subCorrect && emailCorrect && rolesCorrect)
                        .Label($"Roles=[{string.Join(",", roleList)}], " +
                               $"SubCorrect={subCorrect}, EmailCorrect={emailCorrect}, " +
                               $"RolesCorrect={rolesCorrect} (token had [{string.Join(",", tokenRoles)}])");
                }
            });
    }

    /// <summary>
    /// Property 18 (complementary): The new refresh token stored in the database
    /// is valid (not used, not revoked, not expired).
    ///
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property RefreshToken_NewRefreshToken_IsStoredAsValidInDatabase()
    {
        var expiryScenarioGen = Gen.Elements(false, true); // rememberMe flag

        return Prop.ForAll(
            expiryScenarioGen.ToArbitrary(),
            rememberMe =>
            {
                // Arrange
                var (service, dbContext, userManagerMock, user) = CreateServiceWithUser(
                    "Test", "User", "refresh.test@buildestate.com",
                    new List<string> { "ProjectManager" });

                using (dbContext)
                {
                    // Generate initial token pair with rememberMe setting
                    var (_, initialRefreshToken) = service.GenerateTokensAsync(
                        user, new List<string> { "ProjectManager" }, rememberMe: rememberMe)
                        .GetAwaiter().GetResult();

                    // Act: Refresh the token
                    var (_, newRefreshToken) = service.RefreshTokenAsync(
                        initialRefreshToken, "172.16.0.1", "Firefox/121")
                        .GetAwaiter().GetResult();

                    // Assert: new refresh token is stored in DB and is valid
                    var storedNewToken = dbContext.RefreshTokens
                        .FirstOrDefault(t => t.Token == newRefreshToken);

                    var tokenExists = storedNewToken is not null;
                    var isNotUsed = storedNewToken?.IsUsed == false;
                    var isNotRevoked = storedNewToken?.IsRevoked == false;
                    var isNotExpired = storedNewToken?.ExpiresAt > DateTime.UtcNow;
                    var belongsToUser = storedNewToken?.UserId == user.Id;

                    return (tokenExists && isNotUsed && isNotRevoked && isNotExpired && belongsToUser)
                        .Label($"RememberMe={rememberMe}, TokenExists={tokenExists}, " +
                               $"NotUsed={isNotUsed}, NotRevoked={isNotRevoked}, " +
                               $"NotExpired={isNotExpired}, BelongsToUser={belongsToUser}");
                }
            });
    }

    #endregion

    #region Helper Methods

    private static (TokenService Service, BuildEstateDbContext DbContext,
        Mock<UserManager<ApplicationUser>> UserManagerMock, ApplicationUser User)
        CreateServiceWithUser(string firstName, string lastName, string email, IList<string> roles)
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var dbContext = new BuildEstateDbContext(options);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = email,
            UserName = email,
            FirstName = firstName,
            LastName = lastName,
            IsActive = true
        };

        var userManagerMock = CreateUserManagerMock(user, roles);

        var configData = new Dictionary<string, string?>
        {
            ["JwtSettings:Issuer"] = TestIssuer,
            ["JwtSettings:Audience"] = TestAudience,
            ["JwtSettings:Secret"] = TestSecret
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var service = new TokenService(
            configuration, dbContext, userManagerMock.Object,
            Mock.Of<ILogger<TokenService>>());

        return (service, dbContext, userManagerMock, user);
    }

    private static Mock<UserManager<ApplicationUser>> CreateUserManagerMock(
        ApplicationUser user, IList<string> roles)
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object,
            Mock.Of<IOptions<IdentityOptions>>(),
            Mock.Of<IPasswordHasher<ApplicationUser>>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            Array.Empty<IPasswordValidator<ApplicationUser>>(),
            Mock.Of<ILookupNormalizer>(),
            Mock.Of<IdentityErrorDescriber>(),
            Mock.Of<IServiceProvider>(),
            Mock.Of<ILogger<UserManager<ApplicationUser>>>());

        userManagerMock.Setup(m => m.FindByIdAsync(user.Id))
            .ReturnsAsync(user);
        userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(roles);

        return userManagerMock;
    }

    private static IList<string> GetRolesForSeed(int seed)
    {
        var allRoles = new[]
        {
            "SuperAdmin", "AcquisitionManager", "LegalOfficer", "PlanningManager",
            "ProjectManager", "SiteManager", "SalesManager", "CompletionManager",
            "PropertyManager", "FinanceDirector", "ValuationAnalyst", "Surveyor", "Admin"
        };

        // Generate 1-3 roles based on seed
        var count = (seed % 3) + 1;
        var startIndex = (seed - 1) % allRoles.Length;
        var roles = new List<string>();

        for (var i = 0; i < count; i++)
        {
            roles.Add(allRoles[(startIndex + i) % allRoles.Length]);
        }

        return roles;
    }

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
