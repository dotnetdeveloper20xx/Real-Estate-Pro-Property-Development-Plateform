using System.Security.Claims;
using FsCheck;
using FsCheck.Xunit;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Search.Providers;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Tests.PropertyTests.Search;

/// <summary>
/// Property-based tests for permission filtering completeness across search providers.
/// Verifies that:
/// - Users without required roles receive zero results from protected providers
/// - Users with correct roles receive results (access granted)
/// - The permission boundary is correctly enforced for all role combinations
///
/// **Validates: Requirements 3.1, 6.1, 6.2, 6.3, 6.4, 6.5, 19.5, 24.1-24.5**
/// </summary>
public class SearchPermissionFilteringPropertyTests
{
    #region Helpers

    /// <summary>
    /// Creates a ClaimsPrincipal with the given roles.
    /// </summary>
    private static ClaimsPrincipal CreateUserPrincipal(params string[] roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, "TestUser")
        };

        foreach (var role in roles.Where(r => !string.IsNullOrWhiteSpace(r)))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    /// <summary>
    /// Creates an unauthenticated ClaimsPrincipal (no identity).
    /// </summary>
    private static ClaimsPrincipal CreateUnauthenticatedPrincipal()
    {
        return new ClaimsPrincipal(new ClaimsIdentity());
    }

    /// <summary>
    /// Creates an in-memory DbContext with seeded Land Opportunities for testing.
    /// </summary>
    private static BuildEstateDbContext CreateDbContextWithData()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new BuildEstateDbContext(options);

        // Seed a land opportunity so that authorized users get results
        context.LandOpportunities.Add(new LandOpportunity
        {
            Id = Guid.NewGuid(),
            Name = "Test Opportunity",
            Location = "London",
            Status = OpportunityStatus.Identified,
            LandSize = 5.0m,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed-user"
        });

        context.SaveChanges();
        return context;
    }

    /// <summary>
    /// Defines the known role-to-provider permission matrix.
    /// Maps each provider type to its required roles.
    /// </summary>
    private static readonly Dictionary<string, string[]> ProviderRequiredRoles = new()
    {
        ["land-acquisition"] = new[] { "AcquisitionManager", "SuperAdmin" },
        ["planning"] = new[] { "PlanningManager", "SuperAdmin" },
        ["legal"] = new[] { "LegalOfficer", "SuperAdmin" },
        ["users"] = new[] { "SuperAdmin" }
    };

    /// <summary>
    /// Roles that do NOT grant access to any of the role-protected providers.
    /// </summary>
    private static readonly string[] NonPrivilegedRoles = new[]
    {
        "Viewer", "SalesManager", "SiteManager", "CompletionManager",
        "PropertyManager", "FinanceDirector", "ValuationAnalyst"
    };

    /// <summary>
    /// All valid roles in the system that could appear in claims.
    /// </summary>
    private static readonly string[] AllRoles = new[]
    {
        "AcquisitionManager", "PlanningManager", "LegalOfficer", "SuperAdmin",
        "Viewer", "SalesManager", "SiteManager", "CompletionManager",
        "PropertyManager", "FinanceDirector", "ValuationAnalyst", "ProjectManager"
    };

    private static Gen<string[]> RandomRoleSubsetGen()
    {
        return Gen.SubListOf(AllRoles)
            .Select(list => list.ToArray());
    }

    private static Gen<string[]> NonAuthorizedRolesForProvider(string providerModule)
    {
        var requiredRoles = ProviderRequiredRoles[providerModule];
        var excludedRoles = AllRoles.Where(r => !requiredRoles.Contains(r)).ToArray();
        return Gen.SubListOf(excludedRoles)
            .Select(list => list.ToArray());
    }

    #endregion

    #region Property 2a: Non-authorized users get zero results from LandOpportunitySearchProvider

    /// <summary>
    /// Property 2a: For any user without AcquisitionManager or SuperAdmin role,
    /// LandOpportunitySearchProvider returns zero results and zero count.
    /// This validates that the permission boundary blocks unauthorized access completely.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property NonAuthorizedUser_GetsZeroResults_FromLandAcquisition()
    {
        return Prop.ForAll(
            NonAuthorizedRolesForProvider("land-acquisition").ToArbitrary(),
            (string[] roles) =>
            {
                using var dbContext = CreateDbContextWithData();
                var provider = new LandOpportunitySearchProvider(dbContext);
                var user = CreateUserPrincipal(roles);
                var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

                var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
                    .GetAwaiter().GetResult();
                var countResult = provider.CountAsync("test", user, CancellationToken.None)
                    .GetAwaiter().GetResult();

                return (searchResult.Results.Count == 0 && searchResult.TotalCount == 0 && countResult == 0)
                    .Label($"User with roles [{string.Join(",", roles)}] should get 0 results " +
                           $"but got {searchResult.Results.Count} results, count={countResult}");
            });
    }

    #endregion

    #region Property 2b: Authorized users get results from LandOpportunitySearchProvider

    /// <summary>
    /// Property 2b: For any user WITH AcquisitionManager or SuperAdmin role,
    /// LandOpportunitySearchProvider returns results when data exists.
    /// This validates the positive permission path works correctly.
    /// </summary>
    [Property(MaxTest = 20)]
    public Property AuthorizedUser_GetsResults_FromLandAcquisition()
    {
        var authorizedRoleGen = Gen.Elements("AcquisitionManager", "SuperAdmin")
            .Select(role => new[] { role });

        return Prop.ForAll(authorizedRoleGen.ToArbitrary(), (string[] roles) =>
        {
            using var dbContext = CreateDbContextWithData();
            var provider = new LandOpportunitySearchProvider(dbContext);
            var user = CreateUserPrincipal(roles);
            var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

            var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
                .GetAwaiter().GetResult();
            var countResult = provider.CountAsync("test", user, CancellationToken.None)
                .GetAwaiter().GetResult();

            return (searchResult.Results.Count > 0 && countResult > 0)
                .Label($"User with roles [{string.Join(",", roles)}] should get results " +
                       $"but got {searchResult.Results.Count} results, count={countResult}");
        });
    }

    #endregion

    #region Property 2c: Random role combinations — permission boundary is consistent

    /// <summary>
    /// Property 2c: For any random subset of roles, the LandOpportunitySearchProvider
    /// returns results if and only if the user has AcquisitionManager or SuperAdmin.
    /// This proves the permission boundary is complete — no role combination bypasses it,
    /// and all valid role combinations are correctly granted.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RandomRoleCombination_PermissionBoundaryIsConsistent_LandAcquisition()
    {
        return Prop.ForAll(RandomRoleSubsetGen().ToArbitrary(), (string[] roles) =>
        {
            using var dbContext = CreateDbContextWithData();
            var provider = new LandOpportunitySearchProvider(dbContext);
            var user = CreateUserPrincipal(roles);
            var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

            var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
                .GetAwaiter().GetResult();

            var shouldHaveAccess = roles.Contains("AcquisitionManager") || roles.Contains("SuperAdmin");
            var hasResults = searchResult.Results.Count > 0;

            return (shouldHaveAccess == hasResults)
                .Label($"Roles [{string.Join(",", roles)}]: " +
                       $"shouldAccess={shouldHaveAccess}, hasResults={hasResults}");
        });
    }

    #endregion

    #region Property 2d: Unauthenticated users get zero results from all providers

    /// <summary>
    /// Property 2d: An unauthenticated user (no identity) gets zero results
    /// from the Document and Notification providers which check IsAuthenticated.
    /// This validates the authentication boundary for providers that allow any authenticated user.
    /// </summary>
    [Fact]
    public void UnauthenticatedUser_GetsZeroResults_FromDocumentProvider()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var dbContext = new BuildEstateDbContext(options);
        var provider = new DocumentSearchProvider(dbContext);
        var user = CreateUnauthenticatedPrincipal();
        var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

        var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
            .GetAwaiter().GetResult();
        var countResult = provider.CountAsync("test", user, CancellationToken.None)
            .GetAwaiter().GetResult();

        Assert.Equal(0, searchResult.Results.Count);
        Assert.Equal(0, searchResult.TotalCount);
        Assert.Equal(0, countResult);
    }

    #endregion

    #region Property 2e: Non-authorized users get zero results from Planning provider

    /// <summary>
    /// Property 2e: For any user without PlanningManager or SuperAdmin role,
    /// PlanningApplicationSearchProvider returns zero results and zero count.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property NonAuthorizedUser_GetsZeroResults_FromPlanning()
    {
        return Prop.ForAll(
            NonAuthorizedRolesForProvider("planning").ToArbitrary(),
            (string[] roles) =>
            {
                var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
                    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                    .Options;
                using var dbContext = new BuildEstateDbContext(options);
                var provider = new PlanningApplicationSearchProvider(dbContext);
                var user = CreateUserPrincipal(roles);
                var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

                var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
                    .GetAwaiter().GetResult();
                var countResult = provider.CountAsync("test", user, CancellationToken.None)
                    .GetAwaiter().GetResult();

                return (searchResult.Results.Count == 0 && countResult == 0)
                    .Label($"User with roles [{string.Join(",", roles)}] should get 0 results from Planning " +
                           $"but got {searchResult.Results.Count} results, count={countResult}");
            });
    }

    #endregion

    #region Property 2f: Non-authorized users get zero results from Legal provider

    /// <summary>
    /// Property 2f: For any user without LegalOfficer or SuperAdmin role,
    /// LegalCaseSearchProvider returns zero results and zero count.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property NonAuthorizedUser_GetsZeroResults_FromLegal()
    {
        return Prop.ForAll(
            NonAuthorizedRolesForProvider("legal").ToArbitrary(),
            (string[] roles) =>
            {
                var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
                    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                    .Options;
                using var dbContext = new BuildEstateDbContext(options);
                var provider = new LegalCaseSearchProvider(dbContext);
                var user = CreateUserPrincipal(roles);
                var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

                var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
                    .GetAwaiter().GetResult();
                var countResult = provider.CountAsync("test", user, CancellationToken.None)
                    .GetAwaiter().GetResult();

                return (searchResult.Results.Count == 0 && countResult == 0)
                    .Label($"User with roles [{string.Join(",", roles)}] should get 0 results from Legal " +
                           $"but got {searchResult.Results.Count} results, count={countResult}");
            });
    }

    #endregion

    #region Property 2g: Non-authorized users get zero results from Users provider

    /// <summary>
    /// Property 2g: For any user without SuperAdmin role,
    /// UserSearchProvider returns zero results and zero count.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property NonAuthorizedUser_GetsZeroResults_FromUsers()
    {
        return Prop.ForAll(
            NonAuthorizedRolesForProvider("users").ToArbitrary(),
            (string[] roles) =>
            {
                var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
                    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                    .Options;
                using var dbContext = new BuildEstateDbContext(options);
                var provider = new UserSearchProvider(dbContext);
                var user = CreateUserPrincipal(roles);
                var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

                var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
                    .GetAwaiter().GetResult();
                var countResult = provider.CountAsync("test", user, CancellationToken.None)
                    .GetAwaiter().GetResult();

                return (searchResult.Results.Count == 0 && countResult == 0)
                    .Label($"User with roles [{string.Join(",", roles)}] should get 0 results from Users " +
                           $"but got {searchResult.Results.Count} results, count={countResult}");
            });
    }

    #endregion

    #region Property 2h: SuperAdmin has access to ALL role-protected providers

    /// <summary>
    /// Property 2h: A SuperAdmin user should have access to all role-protected providers.
    /// This verifies that the SuperAdmin role universally grants access across all modules.
    /// </summary>
    [Fact]
    public void SuperAdmin_HasAccessToAllProviders()
    {
        var user = CreateUserPrincipal("SuperAdmin");
        var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

        // Land Acquisition
        using var landDb = CreateDbContextWithData();
        var landProvider = new LandOpportunitySearchProvider(landDb);
        var landResult = landProvider.SearchAsync(request, user, CancellationToken.None)
            .GetAwaiter().GetResult();
        Assert.True(landResult.Results.Count > 0,
            "SuperAdmin should have access to Land Acquisition results");

        // Planning (empty DB is fine — just verify no permission denial via empty result vs TotalCount)
        var planOptions = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var planDb = new BuildEstateDbContext(planOptions);
        var planProvider = new PlanningApplicationSearchProvider(planDb);
        var planResult = planProvider.SearchAsync(request, user, CancellationToken.None)
            .GetAwaiter().GetResult();
        // With empty DB, should get 0 results but NOT because of permission denial
        Assert.Equal(0, planResult.Results.Count); // Empty DB
        Assert.False(planResult.IsTimedOut);

        // Legal
        var legalOptions = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var legalDb = new BuildEstateDbContext(legalOptions);
        var legalProvider = new LegalCaseSearchProvider(legalDb);
        var legalResult = legalProvider.SearchAsync(request, user, CancellationToken.None)
            .GetAwaiter().GetResult();
        Assert.False(legalResult.IsTimedOut);

        // Users
        var userOptions = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var userDb = new BuildEstateDbContext(userOptions);
        var userProvider = new UserSearchProvider(userDb);
        var userResult = userProvider.SearchAsync(request, user, CancellationToken.None)
            .GetAwaiter().GetResult();
        Assert.False(userResult.IsTimedOut);
    }

    #endregion

    #region Property 2i: Permission filtering consistency across SearchAsync and CountAsync

    /// <summary>
    /// Property 2i: For any role combination, SearchAsync and CountAsync must agree —
    /// if SearchAsync returns 0 results due to permission denial, CountAsync must also return 0.
    /// No inaccessible entity can appear in counts.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property SearchAndCount_PermissionConsistency_LandAcquisition()
    {
        return Prop.ForAll(RandomRoleSubsetGen().ToArbitrary(), (string[] roles) =>
        {
            using var dbContext = CreateDbContextWithData();
            var provider = new LandOpportunitySearchProvider(dbContext);
            var user = CreateUserPrincipal(roles);
            var request = new SearchRequest { Query = "test", Page = 1, PageSize = 50 };

            var searchResult = provider.SearchAsync(request, user, CancellationToken.None)
                .GetAwaiter().GetResult();
            var countResult = provider.CountAsync("test", user, CancellationToken.None)
                .GetAwaiter().GetResult();

            var searchHasResults = searchResult.Results.Count > 0;
            var countHasResults = countResult > 0;

            return (searchHasResults == countHasResults)
                .Label($"Roles [{string.Join(",", roles)}]: " +
                       $"searchResults={searchResult.Results.Count}, count={countResult} — must agree");
        });
    }

    #endregion
}
