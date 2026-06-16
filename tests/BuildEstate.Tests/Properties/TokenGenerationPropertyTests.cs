using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
using Moq;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Token Generation (Property 1).
///
/// Property 1: Token Generation Produces Correct Claims and Expiry
/// For any valid user with any non-empty set of roles, generating a JWT access token
/// SHALL produce a token containing the user's ID, email, and all assigned roles as claims,
/// with an expiration exactly 60 minutes from issuance.
///
/// **Validates: Requirements 1.1**
/// </summary>
public class TokenGenerationPropertyTests
{
    private const int AccessTokenExpiryMinutes = 60;
    private const int ExpiryToleranceSeconds = 5;

    private static readonly string[] AvailableRoles = new[]
    {
        "SuperAdmin", "AcquisitionManager", "LegalOfficer", "PlanningManager",
        "ProjectManager", "SiteManager", "SalesManager", "CompletionManager",
        "PropertyManager", "FinanceDirector", "ValuationAnalyst", "Surveyor", "Admin"
    };

    #region Property 1: Token Generation Produces Correct Claims and Expiry

    /// <summary>
    /// Property 1: For any valid user with any non-empty set of roles, the generated JWT
    /// access token contains the correct sub claim (user ID).
    ///
    /// **Validates: Requirements 1.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property GeneratedToken_ContainsCorrectSubClaim_ForAnyValidUser()
    {
        return Prop.ForAll(
            ArbitraryUserData(),
            data =>
            {
                // Arrange
                var (service, dbContext) = CreateTokenService();

                try
                {
                    var beforeGeneration = DateTime.UtcNow;

                    // Act
                    var (accessToken, _) = service.GenerateTokensAsync(
                        data.UserId, data.Email, data.FirstName, data.LastName,
                        data.Roles).GetAwaiter().GetResult();

                    // Assert: decode the JWT and verify the sub claim
                    var handler = new JwtSecurityTokenHandler();
                    var jwt = handler.ReadJwtToken(accessToken);

                    var subClaim = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                    subClaim.Should().Be(data.UserId,
                        because: "the JWT sub claim must match the user's ID");

                    return true;
                }
                finally
                {
                    dbContext.Dispose();
                }
            });
    }

    /// <summary>
    /// Property 1: For any valid user with any non-empty set of roles, the generated JWT
    /// access token contains the correct email claim.
    ///
    /// **Validates: Requirements 1.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property GeneratedToken_ContainsCorrectEmailClaim_ForAnyValidUser()
    {
        return Prop.ForAll(
            ArbitraryUserData(),
            data =>
            {
                // Arrange
                var (service, dbContext) = CreateTokenService();

                try
                {
                    // Act
                    var (accessToken, _) = service.GenerateTokensAsync(
                        data.UserId, data.Email, data.FirstName, data.LastName,
                        data.Roles).GetAwaiter().GetResult();

                    // Assert: decode the JWT and verify the email claim
                    var handler = new JwtSecurityTokenHandler();
                    var jwt = handler.ReadJwtToken(accessToken);

                    var emailClaim = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
                    emailClaim.Should().Be(data.Email,
                        because: "the JWT email claim must match the user's email address");

                    return true;
                }
                finally
                {
                    dbContext.Dispose();
                }
            });
    }

    /// <summary>
    /// Property 1: For any valid user with any non-empty set of roles, the generated JWT
    /// access token contains ALL assigned roles as claims.
    ///
    /// **Validates: Requirements 1.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property GeneratedToken_ContainsAllRoleClaims_ForAnyValidUser()
    {
        return Prop.ForAll(
            ArbitraryUserData(),
            data =>
            {
                // Arrange
                var (service, dbContext) = CreateTokenService();

                try
                {
                    // Act
                    var (accessToken, _) = service.GenerateTokensAsync(
                        data.UserId, data.Email, data.FirstName, data.LastName,
                        data.Roles).GetAwaiter().GetResult();

                    // Assert: decode the JWT and verify all role claims are present
                    var handler = new JwtSecurityTokenHandler();
                    var jwt = handler.ReadJwtToken(accessToken);

                    var roleClaims = jwt.Claims
                        .Where(c => c.Type == "role")
                        .Select(c => c.Value)
                        .ToList();

                    roleClaims.Should().BeEquivalentTo(data.Roles,
                        because: "the JWT must contain a role claim for every assigned role");

                    return true;
                }
                finally
                {
                    dbContext.Dispose();
                }
            });
    }

    /// <summary>
    /// Property 1: For any valid user with any non-empty set of roles, the generated JWT
    /// access token has an expiration exactly 60 minutes from issuance (within tolerance).
    ///
    /// **Validates: Requirements 1.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property GeneratedToken_HasSixtyMinuteExpiry_ForAnyValidUser()
    {
        return Prop.ForAll(
            ArbitraryUserData(),
            data =>
            {
                // Arrange
                var (service, dbContext) = CreateTokenService();

                try
                {
                    var beforeGeneration = DateTime.UtcNow;

                    // Act
                    var (accessToken, _) = service.GenerateTokensAsync(
                        data.UserId, data.Email, data.FirstName, data.LastName,
                        data.Roles).GetAwaiter().GetResult();

                    var afterGeneration = DateTime.UtcNow;

                    // Assert: decode the JWT and verify expiry is ~60 minutes from now
                    var handler = new JwtSecurityTokenHandler();
                    var jwt = handler.ReadJwtToken(accessToken);

                    var expectedEarliestExpiry = beforeGeneration.AddMinutes(AccessTokenExpiryMinutes);
                    var expectedLatestExpiry = afterGeneration.AddMinutes(AccessTokenExpiryMinutes);

                    jwt.ValidTo.Should().BeOnOrAfter(expectedEarliestExpiry.AddSeconds(-ExpiryToleranceSeconds),
                        because: "token expiry must be approximately 60 minutes from issuance");
                    jwt.ValidTo.Should().BeOnOrBefore(expectedLatestExpiry.AddSeconds(ExpiryToleranceSeconds),
                        because: "token expiry must be approximately 60 minutes from issuance");

                    return true;
                }
                finally
                {
                    dbContext.Dispose();
                }
            });
    }

    #endregion

    #region Generators

    /// <summary>
    /// Test data record representing arbitrary user attributes for token generation.
    /// </summary>
    public record UserTokenData(string UserId, string Email, string FirstName, string LastName, IList<string> Roles);

    /// <summary>
    /// Generates arbitrary valid user data with random user ID, email, name, and
    /// a non-empty subset of available roles.
    /// </summary>
    private static Arbitrary<UserTokenData> ArbitraryUserData()
    {
        var userIdGen = Gen.Elements(Enumerable.Range(1, 1000)
            .Select(_ => Guid.NewGuid().ToString())
            .ToArray());

        var firstNameGen = Gen.Elements("Alice", "Bob", "Charlie", "Diana", "Eve",
            "Frank", "Grace", "Henry", "Iris", "Jack");

        var lastNameGen = Gen.Elements("Smith", "Johnson", "Williams", "Brown", "Jones",
            "Garcia", "Miller", "Davis", "Rodriguez", "Martinez");

        var emailGen = from first in firstNameGen
                       from last in lastNameGen
                       from num in Gen.Choose(1, 999)
                       select $"{first.ToLower()}.{last.ToLower()}{num}@buildestate.com";

        // Generate non-empty subsets of roles (1 to 5 roles)
        var rolesGen = from count in Gen.Choose(1, 5)
                       from roles in Gen.ArrayOf(count, Gen.Elements(AvailableRoles))
                       select (IList<string>)roles.Distinct().ToList();

        // Ensure at least 1 role after deduplication
        var nonEmptyRolesGen = rolesGen.Where(r => r.Count > 0);

        var gen = from userId in userIdGen
                  from email in emailGen
                  from firstName in firstNameGen
                  from lastName in lastNameGen
                  from roles in nonEmptyRolesGen
                  select new UserTokenData(userId, email, firstName, lastName, roles);

        return Arb.From(gen);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Creates a TokenService instance with in-memory database and test JWT configuration.
    /// Returns both the service and the DbContext for disposal.
    /// </summary>
    private static (TokenService Service, BuildEstateDbContext DbContext) CreateTokenService()
    {
        // Create in-memory database for refresh token storage
        var dbOptions = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: $"TokenTest_{Guid.NewGuid()}")
            .Options;

        var dbContext = new BuildEstateDbContext(dbOptions);

        // Create test JWT configuration
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Issuer"] = "BuildEstate-Test",
                ["JwtSettings:Audience"] = "BuildEstate-Test-Audience",
                ["JwtSettings:Secret"] = "ThisIsATestSecretKeyThatIsAtLeast32BytesLong!!"
            })
            .Build();

        // Create a mock UserManager (not used for GenerateTokensAsync with primitive params)
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object,
            null!, null!, null!, null!, null!, null!, null!, null!);

        var service = new TokenService(
            configuration,
            dbContext,
            userManagerMock.Object,
            Mock.Of<ILogger<TokenService>>());

        return (service, dbContext);
    }

    #endregion
}
